"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  DUMMY_HASH,
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import type { FormState } from "@/lib/form-state"
import { rateLimit, rateLimitReset } from "@/lib/rate-limit"
import { isValidTimezone } from "@/lib/time"

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

async function clientIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  const tzRaw = String(formData.get("timezone") ?? "")
  const timezone = isValidTimezone(tzRaw) ? tzRaw : "Asia/Tehran"

  if (!USERNAME_RE.test(username)) {
    return { error: "نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، عدد و _ باشد", username }
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "رمز عبور باید حداقل ۸ کاراکتر باشد", username }
  }
  if (password !== confirm) {
    return { error: "رمز عبور و تکرار آن یکسان نیستند", username }
  }
  if (!rateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: "تعداد تلاش‌ها زیاد بود، کمی بعد دوباره امتحان کن", username }
  }

  const exists = await queryOne("SELECT 1 FROM users WHERE username = $1", [username])
  if (exists) return { error: "این نام کاربری قبلاً گرفته شده", username }

  const hash = await hashPassword(password)
  let userId: number
  try {
    const rows = await query<{ id: number }>(
      "INSERT INTO users (username, password_hash, timezone) VALUES ($1, $2, $3) RETURNING id",
      [username, hash, timezone]
    )
    userId = rows[0].id
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return { error: "این نام کاربری قبلاً گرفته شده", username }
    }
    throw e
  }

  await createSession(userId)
  redirect("/")
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const key = `login:${username}:${await clientIp()}`

  if (!rateLimit(key, 8, 15 * 60 * 1000)) {
    return { error: "تلاش‌های ناموفق زیاد بود، ۱۵ دقیقه بعد دوباره امتحان کن", username }
  }

  const row = await queryOne<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE username = $1",
    [username]
  )
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH)
  if (!row || !ok) {
    return { error: "نام کاربری یا رمز عبور اشتباه است", username }
  }

  rateLimitReset(key)
  await createSession(row.id)
  redirect("/")
}

export async function logoutAction() {
  await destroySession()
  redirect("/login")
}
