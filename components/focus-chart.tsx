"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, XAxis } from "recharts"
import { Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { fa, formatDuration } from "@/lib/format"
import type { DayPoint, SessionItem } from "@/lib/timer-types"

const config = {
  other: { label: "تمرکز", color: "oklch(1 0 0 / 38%)" },
  current: { label: "روز انتخاب‌شده", color: "var(--primary)" },
} satisfies ChartConfig

export function FocusChart({ days, sessions }: { days: DayPoint[]; sessions: SessionItem[] }) {
  const [selected, setSelected] = useState(days[days.length - 1]?.day ?? "")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth // امروز در انتهای نمودار است
  }, [])

  const labelOf = useMemo(() => new Map(days.map((d) => [d.day, d.label])), [days])
  const data = useMemo(
    () =>
      days.map((d) => ({
        day: d.day,
        other: d.day === selected ? 0 : d.minutes,
        current: d.day === selected ? d.minutes : 0,
      })),
    [days, selected]
  )

  const selectedDay = days.find((d) => d.day === selected)
  const daySessions = useMemo(
    () => sessions.filter((s) => s.day === selected),
    [sessions, selected]
  )

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>تمرکز روزانه</CardTitle>
          <CardDescription>۱۰۰ روز اخیر؛ روی هر روز بزن تا تسک‌هایش را ببینی.</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={scrollRef} dir="ltr" className="overflow-x-auto">
            <div className="relative min-w-[720px]">
              <ChartContainer config={config} className="aspect-auto h-56 w-full">
                <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    height={24}
                    interval={6}
                    tickFormatter={(v: string) => labelOf.get(v) ?? v}
                  />
                  <Bar dataKey="other" stackId="a" fill="var(--color-other)" isAnimationActive={false} />
                  <Bar dataKey="current" stackId="a" fill="var(--color-current)" isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
              {/* لایه‌ی کلیک: ۱۰۰ ستون هم‌عرض روی نمودار، حتی برای روزهای بدون تمرکز */}
              <div className="absolute inset-x-0 top-0 bottom-6 flex">
                {days.map((d) => (
                  <Button
                    key={d.day}
                    type="button"
                    variant="ghost"
                    onClick={() => setSelected(d.day)}
                    aria-label={`${d.fullLabel}، ${formatDuration(d.minutes * 60)}`}
                    aria-pressed={d.day === selected}
                    style={{ height: "100%", flex: "1 1 0%", minWidth: 0, padding: 0 }}
                    className="rounded-none hover:bg-foreground/10 dark:hover:bg-foreground/10"
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDay?.fullLabel}</CardTitle>
          <CardDescription>
            {selectedDay && selectedDay.minutes > 0
              ? `${formatDuration(selectedDay.minutes * 60)} تمرکز · ${fa(daySessions.length)} نشست`
              : "این روز تمرکزی ثبت نشده"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daySessions.length === 0 ? (
            <Empty className="border p-6">
              <EmptyHeader>
                <EmptyTitle>تسکی نیست</EmptyTitle>
                <EmptyDescription>برای این روز چیزی ثبت نشده است.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {daySessions.map((s) => (
                <Item key={s.id} variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle className="text-sm">
                      {s.isPrivate && <Lock className="size-3.5 text-primary" />}
                      {s.title}
                    </ItemTitle>
                    <span className="text-xs text-muted-foreground">
                      {s.start} تا {s.end}
                    </span>
                  </ItemContent>
                  <Badge variant="destructive">
                    {formatDuration(s.minutes * 60)}
                  </Badge>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
