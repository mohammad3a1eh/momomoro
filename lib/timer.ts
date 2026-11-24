import { query, queryOne } from "@/lib/db"
import type { User } from "@/lib/auth"
import type { TimerMode, TimerResult, TimerState } from "@/lib/timer-types"

type Row = {
  mode: string
  task_id: number | null
  duration_sec: number
  started_ms: number
  run_started_ms: number | null
  elapsed_before_ms: number
  now_ms: number
}

const SELECT = `
  SELECT mode, task_id, duration_sec,
         (extract(epoch from started_at) * 1000)::float8 AS started_ms,
         (extract(epoch from run_started_at) * 1000)::float8 AS run_started_ms,
         elapsed_before_ms::float8 AS elapsed_before_ms,
         (extract(epoch from now()) * 1000)::float8 AS now_ms
    FROM active_timers WHERE user_id = $1`

function elapsedMs(row: Row): number {
  return row.elapsed_before_ms + (row.run_started_ms != null ? row.now_ms - row.run_started_ms : 0)
}

function toState(row: Row): TimerState {
  return {
    mode: row.mode as TimerMode,
    taskId: row.task_id,
    durationSec: row.duration_sec,
    elapsedBeforeMs: row.elapsed_before_ms,
    runStartedAt: row.run_started_ms,
    startedAt: row.started_ms,
  }
}

async function logFocus(userId: number, taskId: number | null, startedMs: number, seconds: number) {
  await query(
    "INSERT INTO focus_sessions (user_id, task_id, started_at, seconds) VALUES ($1, $2, to_timestamp($3::float8 / 1000.0), $4)",
    [userId, taskId, startedMs, seconds]
  )
}

/** وضعیت فعلی؛ اگر زمانش تمام شده باشد ثبت و پاک می‌شود */
export async function readTimer(userId: number): Promise<TimerResult> {
  const row = await queryOne<Row>(SELECT, [userId])
  if (!row) return { timer: null, serverNow: Date.now() }
  if (row.run_started_ms != null && elapsedMs(row) >= row.duration_sec * 1000) {
    const claimed = await query("DELETE FROM active_timers WHERE user_id = $1 RETURNING user_id", [userId])
    if (claimed.length > 0 && row.mode === "focus") {
      await logFocus(userId, row.task_id, row.started_ms, row.duration_sec)
    }
    return { timer: null, serverNow: row.now_ms, completed: true }
  }
  return { timer: toState(row), serverNow: row.now_ms }
}

export async function startTimer(user: User, mode: TimerMode, taskId: number | null): Promise<TimerResult> {
  const minutes =
    mode === "focus" ? user.focusMinutes : mode === "short" ? user.shortBreakMinutes : user.longBreakMinutes

  let validTask: number | null = null
  if (mode === "focus" && taskId != null) {
    const t = await queryOne<{ id: number }>(
      "SELECT id FROM tasks WHERE id = $1 AND user_id = $2 AND archived_at IS NULL",
      [taskId, user.id]
    )
    if (!t) return { ...(await readTimer(user.id)), error: "این تسک پیدا نشد" }
    validTask = t.id
  }

  await stopTimer(user.id) // اگر تایمر قبلی هست، ثبت و پاک شود
  await query(
    `INSERT INTO active_timers (user_id, mode, task_id, duration_sec, started_at, run_started_at, elapsed_before_ms, updated_at)
     VALUES ($1, $2, $3, $4, now(), now(), 0, now())
     ON CONFLICT (user_id) DO UPDATE SET
       mode = EXCLUDED.mode, task_id = EXCLUDED.task_id, duration_sec = EXCLUDED.duration_sec,
       started_at = now(), run_started_at = now(), elapsed_before_ms = 0, updated_at = now()`,
    [user.id, mode, validTask, minutes * 60]
  )
  return readTimer(user.id)
}

export async function pauseTimer(userId: number): Promise<TimerResult> {
  await query(
    `UPDATE active_timers
        SET elapsed_before_ms = elapsed_before_ms + (extract(epoch from now() - run_started_at) * 1000)::bigint,
            run_started_at = NULL, updated_at = now()
      WHERE user_id = $1 AND run_started_at IS NOT NULL`,
    [userId]
  )
  return readTimer(userId)
}

export async function resumeTimer(userId: number): Promise<TimerResult> {
  await query(
    "UPDATE active_timers SET run_started_at = now(), updated_at = now() WHERE user_id = $1 AND run_started_at IS NULL",
    [userId]
  )
  return readTimer(userId)
}

/** توقف دستی؛ اگر تمرکز حداقل یک دقیقه بوده، همان مقدار ثبت می‌شود */
export async function stopTimer(userId: number): Promise<TimerResult> {
  const row = await queryOne<Row>(SELECT, [userId])
  if (row) {
    const claimed = await query("DELETE FROM active_timers WHERE user_id = $1 RETURNING user_id", [userId])
    if (claimed.length > 0 && row.mode === "focus") {
      const el = elapsedMs(row)
      if (el >= 60_000) {
        await logFocus(userId, row.task_id, row.started_ms, Math.min(row.duration_sec, Math.round(el / 1000)))
      }
    }
  }
  return { timer: null, serverNow: Date.now() }
}

/** کلاینت وقتی شمارش معکوس تمام شد صدا می‌زند */
export async function finishTimer(userId: number): Promise<TimerResult> {
  const row = await queryOne<Row>(SELECT, [userId])
  if (!row) return { timer: null, serverNow: Date.now() }
  if (row.run_started_ms != null && elapsedMs(row) >= row.duration_sec * 1000 - 3000) {
    const claimed = await query("DELETE FROM active_timers WHERE user_id = $1 RETURNING user_id", [userId])
    if (claimed.length > 0 && row.mode === "focus") {
      await logFocus(userId, row.task_id, row.started_ms, row.duration_sec)
    }
    return { timer: null, serverNow: row.now_ms, completed: true }
  }
  return { timer: toState(row), serverNow: row.now_ms }
}
