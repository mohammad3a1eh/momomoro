import type { Metadata } from "next"
import Link from "next/link"

import { LiveList } from "@/components/live-list"
import { PageShell } from "@/components/page-shell"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { getLiveTimers, getUserCount } from "@/lib/stats"
import { fa } from "@/lib/format"
export const metadata: Metadata = { title: "فعال‌ها" }
export const dynamic = "force-dynamic"

export default async function LivePage() {
  const user = await getCurrentUser()
  const [{ items, serverNow }, userCount] = await Promise.all([
    getLiveTimers(user?.id ?? null),
    getUserCount(),
  ])
  return (
    <PageShell>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">الان چه کسانی در حال تمرکزند؟</h1>
        <p className="text-sm text-muted-foreground">
          هر ۱۵ ثانیه خودکار به‌روز می‌شود.
        </p>
        <p className="text-sm text-muted-foreground">
          {fa(userCount)} نفر ثبت‌نام کرده‌اند · {fa(items.length)} نفر الان
          فعال
        </p>
      </div>

      <LiveList items={items} serverNow={serverNow} />

      {!user && (
        <div className="flex gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            ثبت‌نام
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            ورود
          </Link>
        </div>
      )}
    </PageShell>
  )
}
