"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Coffee, Pause, Play, Square } from "lucide-react"

import {
  finishTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  startTimerAction,
  stopTimerAction,
  syncTimerAction,
} from "@/app/actions/timer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notify, playChime, primeAudio, requestNotifyPermission } from "@/lib/client-effects"
import { fa, formatClock, formatDuration } from "@/lib/format"
import type { TimerMode, TimerResult, TimerState } from "@/lib/timer-types"

type TaskLite = { id: number; title: string; isPrivate: boolean }

type Props = {
  durations: { focus: number; short: number; long: number }
  longEvery: number
  tasks: TaskLite[]
  initialTimer: TimerState | null
  serverNow: number
  todayCount: number
  todaySeconds: number
}

const MODE_LABEL: Record<TimerMode, string> = {
  focus: "تمرکز",
  short: "استراحت کوتاه",
  long: "استراحت بلند",
}

const RADIUS = 45
const CIRC = 2 * Math.PI * RADIUS

export function TimerPanel(props: Props) {
  const { durations, longEvery, tasks, todayCount, todaySeconds } = props
  const router = useRouter()

  const [timer, setTimer] = useState<TimerState | null>(props.initialTimer)
  const [mode, setMode] = useState<TimerMode>(props.initialTimer?.mode ?? "focus")
  const [taskId, setTaskId] = useState<string>(
    props.initialTimer?.taskId != null ? String(props.initialTimer.taskId) : ""
  )
  const [now, setNow] = useState(props.serverNow)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const offset = useRef(0) // serverTime - Date.now()
  const finishing = useRef(false)

  const apply = useCallback((res: TimerResult, sentAt: number) => {
    const rtt = Date.now() - sentAt
    offset.current = res.serverNow + rtt / 2 - Date.now()
    setTimer(res.timer)
    setNow(Date.now() + offset.current)
    setError(res.error ?? null)
  }, [])

  // همگام‌سازی ساعت و وضعیت با سرور (بار اول و هر بار که تب دوباره دیده می‌شود)
  useEffect(() => {
    offset.current = props.serverNow - Date.now()
    const sync = async () => {
      const sent = Date.now()
      try {
        const res = await syncTimerAction()
        apply(res, sent)
        if (res.completed) router.refresh()
      } catch {
        /* آفلاین */
      }
    }
    void sync()
    const onVis = () => {
      if (document.visibilityState === "visible") void sync()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const running = !!timer && timer.runStartedAt != null
  const paused = !!timer && timer.runStartedAt == null
  const activeMode: TimerMode = timer?.mode ?? mode

  const totalMs = timer ? timer.durationSec * 1000 : durations[mode] * 60_000
  const elapsedMs = timer
    ? timer.elapsedBeforeMs + (timer.runStartedAt != null ? now - timer.runStartedAt : 0)
    : 0
  const remainingMs = Math.max(0, totalMs - elapsedMs)
  const progress = timer ? Math.min(1, elapsedMs / totalMs) : 0
  const expired = running && remainingMs <= 0

  // تیک ساعت
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now() + offset.current), 250)
    return () => clearInterval(id)
  }, [running])

  // پایان شمارش
  useEffect(() => {
    if (!expired || !timer || finishing.current) return
    finishing.current = true
    const finishedMode = timer.mode
    const sent = Date.now()
    void (async () => {
      try {
        const res = await finishTimerAction()
        apply(res, sent)
        if (res.completed) {
          playChime()
          if (finishedMode === "focus") {
            void notify("تمرکزت تموم شد", "وقت استراحته 🍅")
            setMode((todayCount + 1) % longEvery === 0 ? "long" : "short")
          } else {
            void notify("استراحت تموم شد", "آماده‌ای برای دور بعدی؟")
            setMode("focus")
          }
          router.refresh()
        }
      } catch {
        /* دوباره تلاش می‌شود */
      } finally {
        finishing.current = false
      }
    })()
  }, [expired, timer, apply, router, todayCount, longEvery])

  // عنوان تب
  useEffect(() => {
    if (!timer) return
    const original = document.title
    document.title = `${formatClock(remainingMs)} · ${MODE_LABEL[timer.mode]}`
    return () => {
      document.title = original
    }
  }, [timer, remainingMs])

  function run(fn: () => Promise<TimerResult>, refresh = false) {
    setError(null)
    const sent = Date.now()
    startTransition(async () => {
      try {
        const res = await fn()
        apply(res, sent)
        if (refresh) router.refresh()
      } catch {
        setError("ارتباط با سرور برقرار نشد")
      }
    })
  }

  const onStart = () => {
    primeAudio()
    requestNotifyPermission()
    run(() => startTimerAction(mode, mode === "focus" && taskId ? Number(taskId) : null))
  }

  const strokeClass = activeMode === "focus" ? "stroke-primary" : "stroke-foreground"

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6">
        <Tabs
          value={activeMode}
          onValueChange={(v) => setMode(v as TimerMode)}
          className="w-full"
        >
          <TabsList className="w-full">
            {(Object.keys(MODE_LABEL) as TimerMode[]).map((m) => (
              <TabsTrigger key={m} value={m} disabled={!!timer}>
                {MODE_LABEL[m]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative aspect-square w-full max-w-72">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="2.5" className="stroke-foreground/10" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              className={`${strokeClass} transition-[stroke-dashoffset] duration-300 ease-linear`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-6xl font-bold tabular-nums" dir="ltr" role="timer" aria-live="off">
              {formatClock(timer ? remainingMs : totalMs)}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {activeMode !== "focus" && <Coffee className="size-4" />}
              {paused ? "مکث" : MODE_LABEL[activeMode]}
            </span>
          </div>
        </div>

        {activeMode === "focus" && (
          <Field className="max-w-sm">
            <FieldLabel htmlFor="task">تسک</FieldLabel>
            <NativeSelect
              className="w-full"
              value={taskId}
              disabled={!!timer}
              onChange={(e) => setTaskId(e.target.value)}
              id="task"
            >
              <NativeSelectOption value="">بدون تسک</NativeSelectOption>
              {tasks.map((t) => (
                <NativeSelectOption key={t.id} value={String(t.id)}>
                  {t.title}
                  {t.isPrivate ? " (خصوصی)" : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex w-full max-w-sm gap-3">
          {!timer && (
            <Button size="lg" className="flex-1" onClick={onStart} disabled={pending}>
              <Play />
              شروع
            </Button>
          )}
          {running && (
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => run(pauseTimerAction)} disabled={pending}>
              <Pause />
              مکث
            </Button>
          )}
          {paused && (
            <Button size="lg" className="flex-1" onClick={() => run(resumeTimerAction)} disabled={pending}>
              <Play />
              ادامه
            </Button>
          )}
          {timer && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => run(stopTimerAction, true)}
              disabled={pending}
            >
              <Square />
              توقف
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          امروز: {fa(todayCount)} دور · {formatDuration(todaySeconds)}
        </p>
      </CardContent>
    </Card>
  )
}
