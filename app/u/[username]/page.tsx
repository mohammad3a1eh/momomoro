import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Coffee, Flame, Settings, Timer } from "lucide-react"

import { FocusChart } from "@/components/focus-chart"
import { PageShell } from "@/components/page-shell"
import { StatCard } from "@/components/stat-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { queryOne } from "@/lib/db"
import { fa, formatDuration } from "@/lib/format"
import { getLiveTimers, getProfileData } from "@/lib/stats"
import { formatDateFa } from "@/lib/time"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  return { title: `@${decodeURIComponent(username).toLowerCase()}` }
}

export default async function ProfilePage({ params }: Params) {
  const { username: raw } = await params
  const username = decodeURIComponent(raw).toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(username)) notFound()

  const profile = await queryOne<{ id: number; username: string; timezone: string; created_at: Date }>(
    "SELECT id, username, timezone, created_at FROM users WHERE username = $1",
    [username]
  )
  if (!profile) notFound()

  const viewer = await getCurrentUser()
  const own = viewer?.id === profile.id

  const [{ days, sessions, totals }, live] = await Promise.all([
    getProfileData(profile.id, profile.timezone, viewer?.id ?? null),
    getLiveTimers(viewer?.id ?? null, profile.username),
  ])
  const current = live.items[0]

  return (
    <PageShell>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-2xl uppercase">{profile.username.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 dir="ltr" className="w-fit truncate text-xl font-bold">
                {profile.username}
              </h1>
              <span className="text-xs text-muted-foreground">
                عضو از {formatDateFa(profile.created_at)}
              </span>
            </div>
            {own && (
              <Link href="/settings" className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="تنظیمات">
                <Settings />
              </Link>
            )}
          </div>

          {current ? (
            <Badge variant="destructive" className="w-fit text-sm">
              {current.mode === "focus" ? <Timer /> : <Coffee />}
              {current.mode === "focus" ? `الان روی «${current.title}» تمرکز دارد` : "الان در استراحت است"}
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-fit text-sm">
              الان فعال نیست
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="امروز" value={formatDuration(totals.todaySec)} />
        <StatCard label="۷ روز اخیر" value={formatDuration(totals.weekSec)} />
        <StatCard label="۱۰۰ روز اخیر" value={formatDuration(totals.hundredSec)} />
        <StatCard
          label="روزهای پیاپی"
          value={`${fa(totals.streak)} روز`}
          hint={totals.streak >= 3 ? "🔥 ادامه بده" : undefined}
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Flame className="size-3.5 text-primary" />
        مجموع کل: {formatDuration(totals.allTimeSec)} در {fa(totals.allCount)} نشست · بهترین روز: {formatDuration(totals.bestSec)}
      </p>

      <FocusChart days={days} sessions={sessions} />
    </PageShell>
  )
}
