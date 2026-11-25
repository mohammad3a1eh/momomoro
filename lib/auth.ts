import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto"

import { query, queryOne } from "@/lib/db"

const COOKIE = "session"
const SESSION_DAYS = 30

export type User = {
  id: number
  username: string
  timezone: string
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakEvery: number
  createdAt: string
  isPublic: boolean
}

function scryptAsync(password: string, salt: Buffer, len: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, len, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, keyHex] = stored.split("$")
  if (algo !== "scrypt" || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, "hex")
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// برای یکسان‌سازی زمان پاسخ وقتی کاربر وجود ندارد
export const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "00".repeat(64)

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex")
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [sha256(token), userId, expires]
  )
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)])
  }
  jar.delete(COOKIE)
}

type UserRow = {
  id: number
  username: string
  timezone: string
  focus_minutes: number
  short_break_minutes: number
  long_break_minutes: number
  long_break_every: number
  created_at: Date
  is_public: boolean
}

export function mapUser(r: UserRow): User {
  return {
    id: r.id,
    username: r.username,
    timezone: r.timezone,
    focusMinutes: r.focus_minutes,
    shortBreakMinutes: r.short_break_minutes,
    longBreakMinutes: r.long_break_minutes,
    longBreakEvery: r.long_break_every,
    createdAt: r.created_at.toISOString(),
    isPublic: r.is_public,
  }
}

export const USER_COLUMNS =
  "u.id, u.username, u.timezone, u.focus_minutes, u.short_break_minutes, u.long_break_minutes, u.long_break_every, u.is_public, u.created_at"
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  const row = await queryOne<UserRow>(
    `SELECT ${USER_COLUMNS}
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)]
  )
  return row ? mapUser(row) : null
})

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
