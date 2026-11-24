"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  finishTimer,
  pauseTimer,
  readTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from "@/lib/timer"
import type { TimerMode, TimerResult } from "@/lib/timer-types"

const MODES: TimerMode[] = ["focus", "short", "long"]
const EXPIRED: TimerResult = { timer: null, serverNow: 0, error: "نشست منقضی شده، دوباره وارد شو" }

export async function startTimerAction(mode: TimerMode, taskId: number | null): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  if (!MODES.includes(mode)) return { ...(await readTimer(user.id)), error: "حالت نامعتبر" }
  return startTimer(user, mode, taskId != null ? Number(taskId) : null)
}

export async function pauseTimerAction(): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  return pauseTimer(user.id)
}

export async function resumeTimerAction(): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  return resumeTimer(user.id)
}

export async function stopTimerAction(): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  return stopTimer(user.id)
}

export async function finishTimerAction(): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  return finishTimer(user.id)
}

export async function syncTimerAction(): Promise<TimerResult> {
  const user = await getCurrentUser()
  if (!user) return { ...EXPIRED, serverNow: Date.now() }
  return readTimer(user.id)
}
