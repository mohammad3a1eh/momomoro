import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import { PageShell } from "@/components/page-shell"
import { getCurrentUser } from "@/lib/auth"

export const metadata: Metadata = { title: "ثبت‌نام" }
export const dynamic = "force-dynamic"

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/")
  return (
    <PageShell>
      <AuthForm mode="register" />
    </PageShell>
  )
}
