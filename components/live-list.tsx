"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Coffee, Lock } from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { formatClock } from "@/lib/format"
import type { LiveItem } from "@/lib/timer-types"

export function LiveList({ items, serverNow }: { items: LiveItem[]; serverNow: number }) {
  const router = useRouter()
  const [now, setNow] = useState(serverNow)
  const offset = useRef(0)

  useEffect(() => {
    offset.current = serverNow - Date.now()
    setNow(Date.now() + offset.current)
    const tick = setInterval(() => setNow(Date.now() + offset.current), 1000)
    const poll = setInterval(() => router.refresh(), 15_000)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [serverNow, router])

  if (items.length === 0) {
    return (
      <Empty className="border p-8">
        <EmptyHeader>
          <EmptyTitle>الان کسی در حال تمرکز نیست</EmptyTitle>
          <EmptyDescription>اولین نفر باش و یک دور شروع کن.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ItemGroup className="gap-2">
      {items.map((it) => {
        const total = it.durationSec * 1000
        const elapsed = it.elapsedBeforeMs + (it.runStartedAt != null ? now - it.runStartedAt : 0)
        const remaining = Math.max(0, total - elapsed)
        const paused = it.runStartedAt == null
        const isFocus = it.mode === "focus"
        return (
          <Link key={it.username} href={`/u/${it.username}`} className="block">
            <Item variant="outline">
              <Avatar size="lg">
                <AvatarFallback className="uppercase">{it.username.slice(0, 1)}</AvatarFallback>
                {isFocus && !paused && <AvatarBadge />}
              </Avatar>
              <ItemContent>
                <ItemTitle dir="ltr" className="w-fit text-sm">
                  {it.username}
                </ItemTitle>
                <ItemDescription className="flex items-center gap-1.5">
                  {it.isPrivate && <Lock className="size-3.5 text-primary" />}
                  {!isFocus && <Coffee className="size-3.5" />}
                  {it.title}
                </ItemDescription>
              </ItemContent>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold tabular-nums" dir="ltr">
                  {formatClock(remaining)}
                </span>
                {paused && <Badge variant="secondary">مکث</Badge>}
              </div>
            </Item>
          </Link>
        )
      })}
    </ItemGroup>
  )
}
