"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"
import type { FormState } from "@/lib/form-state"

function int(v: FormDataEntryValue | null, min: number, max: number): number | null {
  const n = Number(String(v ?? "").trim())
  if (!Number.isInteger(n) || n < min || n > max) return null
  return n
}

export async function updateSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: "ابتدا وارد شو" }

  const focus = int(formData.get("focus"), 1, 180)
  const short = int(formData.get("short"), 1, 60)
  const long = int(formData.get("long"), 1, 120)
  const every = int(formData.get("every"), 2, 12)

  if (focus == null) return { error: "مدت تمرکز باید بین ۱ تا ۱۸۰ دقیقه باشد" }
  if (short == null) return { error: "استراحت کوتاه باید بین ۱ تا ۶۰ دقیقه باشد" }
  if (long == null) return { error: "استراحت بلند باید بین ۱ تا ۱۲۰ دقیقه باشد" }
  if (every == null) return { error: "تعداد دور تا استراحت بلند باید بین ۲ تا ۱۲ باشد" }

  await query(
    `UPDATE users SET focus_minutes = $1, short_break_minutes = $2, long_break_minutes = $3, long_break_every = $4
      WHERE id = $5`,
    [focus, short, long, every, user.id]
  )
  revalidatePath("/", "layout")
  return { ok: true }
}
