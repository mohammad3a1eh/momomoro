"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

export type TaskResult = { ok: boolean; error?: string }

export async function createTaskAction(title: string, isPrivate: boolean): Promise<TaskResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "ابتدا وارد شو" }
  const clean = String(title ?? "").trim().replace(/\s+/g, " ")
  if (clean.length < 1 || clean.length > 80) {
    return { ok: false, error: "نام تسک باید بین ۱ تا ۸۰ کاراکتر باشد" }
  }
  const count = await queryOne<{ c: number }>(
    "SELECT COUNT(*)::int AS c FROM tasks WHERE user_id = $1 AND archived_at IS NULL",
    [user.id]
  )
  if ((count?.c ?? 0) >= 200) return { ok: false, error: "تعداد تسک‌ها به سقف رسیده" }

  await query("INSERT INTO tasks (user_id, title, is_private) VALUES ($1, $2, $3)", [
    user.id,
    clean,
    !!isPrivate,
  ])
  revalidatePath("/")
  return { ok: true }
}

export async function setTaskPrivacyAction(taskId: number, isPrivate: boolean): Promise<TaskResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "ابتدا وارد شو" }
  await query("UPDATE tasks SET is_private = $1 WHERE id = $2 AND user_id = $3", [
    !!isPrivate,
    Number(taskId),
    user.id,
  ])
  revalidatePath("/")
  return { ok: true }
}

// تسک حذف نمی‌شود، فقط بایگانی می‌شود تا تاریخچه‌ی تمرکز حفظ بماند
export async function archiveTaskAction(taskId: number): Promise<TaskResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "ابتدا وارد شو" }
  await query("UPDATE tasks SET archived_at = now() WHERE id = $1 AND user_id = $2", [
    Number(taskId),
    user.id,
  ])
  revalidatePath("/")
  return { ok: true }
}
