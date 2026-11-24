import { query, queryOne } from "@/lib/db"
import { fa } from "@/lib/format"
import { dayKey, dayLabelFull, dayLabelShort, shiftDay } from "@/lib/time"
import type { LiveItem, ProfileTotals, SessionItem, DayPoint, TimerMode } from "@/lib/timer-types"

export const PRIVATE_TITLE = "تسک خصوصی"
export const NO_TASK_TITLE = "بدون تسک"

export async function getTodayStats(userId: number, tz: string) {
  const row = await queryOne<{ count: number; seconds: number }>(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(seconds), 0)::int AS seconds
       FROM focus_sessions
      WHERE user_id = $1
        AND (started_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
    [userId, tz]
  )
  return { count: row?.count ?? 0, seconds: row?.seconds ?? 0 }
}

export async function getLiveTimers(
  viewerId: number | null,
  onlyUsername?: string
): Promise<{ items: LiveItem[]; serverNow: number }> {
  const rows = await query<{
    user_id: number
    username: string
    mode: string
    duration_sec: number
    title: string | null
    is_private: boolean | null
    run_started_ms: number | null
    elapsed_before_ms: number
    now_ms: number
  }>(
    `SELECT u.id AS user_id, u.username, a.mode, a.duration_sec, t.title, t.is_private,
            (extract(epoch from a.run_started_at) * 1000)::float8 AS run_started_ms,
            a.elapsed_before_ms::float8 AS elapsed_before_ms,
            (extract(epoch from now()) * 1000)::float8 AS now_ms
       FROM active_timers a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN tasks t ON t.id = a.task_id
      WHERE ((a.run_started_at IS NOT NULL
              AND a.run_started_at + ((a.duration_sec * 1000 - a.elapsed_before_ms)::float8 * interval '1 millisecond') > now())
          OR (a.run_started_at IS NULL AND a.updated_at > now() - interval '1 hour'))
        AND ($1::text IS NULL OR u.username = $1::text)
      ORDER BY (a.mode = 'focus') DESC, a.updated_at DESC
      LIMIT 200`,
    [onlyUsername ?? null]
  )
  const items: LiveItem[] = rows.map((r) => {
    const own = viewerId != null && viewerId === r.user_id
    let title: string
    if (r.mode !== "focus") title = "استراحت"
    else if (r.title == null) title = NO_TASK_TITLE
    else if (r.is_private && !own) title = PRIVATE_TITLE
    else title = r.title
    return {
      username: r.username,
      mode: r.mode as TimerMode,
      title,
      isPrivate: r.mode === "focus" && r.title != null && !!r.is_private,
      durationSec: r.duration_sec,
      elapsedBeforeMs: r.elapsed_before_ms,
      runStartedAt: r.run_started_ms,
    }
  })
  return { items, serverNow: rows[0]?.now_ms ?? Date.now() }
}

export async function getProfileData(
  profileUserId: number,
  tz: string,
  viewerId: number | null
): Promise<{ days: DayPoint[]; sessions: SessionItem[]; totals: ProfileTotals }> {
  const own = viewerId === profileUserId

  const rows = await query<{
    id: number
    day: string
    start: string
    end: string
    seconds: number
    title: string | null
    is_private: boolean | null
  }>(
    `SELECT fs.id,
            to_char(fs.started_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day,
            to_char(fs.started_at AT TIME ZONE $2, 'HH24:MI') AS start,
            to_char((fs.started_at + fs.seconds * interval '1 second') AT TIME ZONE $2, 'HH24:MI') AS "end",
            fs.seconds, t.title, t.is_private
       FROM focus_sessions fs
       LEFT JOIN tasks t ON t.id = fs.task_id
      WHERE fs.user_id = $1 AND fs.started_at >= now() - interval '102 days'
      ORDER BY fs.started_at ASC
      LIMIT 5000`,
    [profileUserId, tz]
  )

  const all = await queryOne<{ seconds: number; count: number }>(
    "SELECT COALESCE(SUM(seconds), 0)::int AS seconds, COUNT(*)::int AS count FROM focus_sessions WHERE user_id = $1",
    [profileUserId]
  )

  const today = dayKey(new Date(), tz)
  const first = shiftDay(today, -99)

  const secondsByDay = new Map<string, number>()
  const sessions: SessionItem[] = []
  for (const r of rows) {
    if (r.day < first || r.day > today) continue
    secondsByDay.set(r.day, (secondsByDay.get(r.day) ?? 0) + r.seconds)
    let title: string
    if (r.title == null) title = NO_TASK_TITLE
    else if (r.is_private && !own) title = PRIVATE_TITLE
    else title = r.title
    sessions.push({
      id: r.id,
      day: r.day,
      start: fa(r.start),
      end: fa(r.end),
      minutes: Math.max(1, Math.round(r.seconds / 60)),
      title,
      isPrivate: r.title != null && !!r.is_private,
    })
  }

  const days: DayPoint[] = []
  for (let i = 0; i < 100; i++) {
    const day = shiftDay(first, i)
    days.push({
      day,
      label: dayLabelShort(day),
      fullLabel: dayLabelFull(day),
      minutes: Math.round((secondsByDay.get(day) ?? 0) / 60),
    })
  }

  const secOf = (d: DayPoint) => secondsByDay.get(d.day) ?? 0
  const hundredSec = days.reduce((a, d) => a + secOf(d), 0)
  const weekSec = days.slice(-7).reduce((a, d) => a + secOf(d), 0)
  const bestSec = days.reduce((a, d) => Math.max(a, secOf(d)), 0)

  // رشته‌ی روزهای پیاپی؛ اگر امروز هنوز تمرکزی نداشته، از دیروز شروع می‌شود
  let streak = 0
  let idx = days.length - 1
  if (secOf(days[idx]) === 0) idx -= 1
  while (idx >= 0 && secOf(days[idx]) > 0) {
    streak += 1
    idx -= 1
  }

  return {
    days,
    sessions,
    totals: {
      todaySec: secOf(days[days.length - 1]),
      weekSec,
      hundredSec,
      allTimeSec: all?.seconds ?? 0,
      allCount: all?.count ?? 0,
      streak,
      bestSec,
    },
  }
}
