import type { Metadata } from "next"
import { LogOut } from "lucide-react"

import { logoutAction } from "@/app/actions/auth"
import { InstallCard } from "@/components/install-button"
import { PageShell } from "@/components/page-shell"
import { SettingsForm } from "@/components/settings-form"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = { title: "تنظیمات" }
export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <PageShell>
      <SettingsForm
        focus={user.focusMinutes}
        short={user.shortBreakMinutes}
        long={user.longBreakMinutes}
        every={user.longBreakEvery}
      />
      <InstallCard />
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <LogOut />
          خروج از حساب
        </Button>
      </form>
    </PageShell>
  )
}
