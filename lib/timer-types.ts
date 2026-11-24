export type TimerMode = "focus" | "short" | "long"

export type TimerState = {
  mode: TimerMode
  taskId: number | null
  durationSec: number
  /** میلی‌ثانیه‌ی زمان طی‌شده قبل از آخرین مکث */
  elapsedBeforeMs: number
  /** زمان (epoch ms سرور) شروع آخرین بازه‌ی اجرا؛ null یعنی مکث */
  runStartedAt: number | null
  startedAt: number
}

export type TimerResult = {
  timer: TimerState | null
  serverNow: number
  completed?: boolean
  error?: string
}

export type LiveItem = {
  username: string
  mode: TimerMode
  title: string
  isPrivate: boolean
  durationSec: number
  elapsedBeforeMs: number
  runStartedAt: number | null
}

export type DayPoint = {
  day: string
  label: string
  fullLabel: string
  minutes: number
}

export type SessionItem = {
  id: number
  day: string
  start: string
  end: string
  minutes: number
  title: string
  isPrivate: boolean
}

export type ProfileTotals = {
  todaySec: number
  weekSec: number
  hundredSec: number
  allTimeSec: number
  allCount: number
  streak: number
  bestSec: number
}
