import { redirect } from "next/navigation"

import { PageShell } from "@/components/page-shell"
import { TasksPanel } from "@/components/tasks-panel"
import { TimerPanel } from "@/components/timer-panel"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"
import { getTodayStats } from "@/lib/stats"
import { readTimer } from "@/lib/timer"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/live")

  // اول وضعیت تایمر (ممکن است تمام‌شده باشد و ثبت شود)، بعد آمار امروز
  const timerRes = await readTimer(user.id)
  const [today, taskRows] = await Promise.all([
    getTodayStats(user.id, user.timezone),
    query<{ id: number; title: string; is_private: boolean }>(
      "SELECT id, title, is_private FROM tasks WHERE user_id = $1 AND archived_at IS NULL ORDER BY created_at DESC",
      [user.id]
    ),
  ])
  const tasks = taskRows.map((t) => ({ id: t.id, title: t.title, isPrivate: t.is_private }))

  return (
    <PageShell>
      <TimerPanel
        durations={{ focus: user.focusMinutes, short: user.shortBreakMinutes, long: user.longBreakMinutes }}
        longEvery={user.longBreakEvery}
        tasks={tasks}
        initialTimer={timerRes.timer}
        serverNow={timerRes.serverNow}
        todayCount={today.count}
        todaySeconds={today.seconds}
      />
      <TasksPanel tasks={tasks} />
    </PageShell>
  )
}
