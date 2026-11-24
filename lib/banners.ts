import { readdir } from "node:fs/promises"
import path from "node:path"

import { hourIn } from "@/lib/time"

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"])
const SLOTS = ["morning", "noon", "evening", "night"] as const
type Slot = (typeof SLOTS)[number]

type Entry = { url: string; slot: Slot | null; ratio: number }

const DEFAULT_RATIO = 3

function ratioFromName(name: string): number {
  const m = name.match(/(?:^|[^\d])(\d{1,3})-(\d{1,3})\.[a-z0-9]+$/i)
  if (!m) return DEFAULT_RATIO
  const w = Number(m[1])
  const h = Number(m[2])
  return w > 0 && h > 0 ? w / h : DEFAULT_RATIO
}

const g = globalThis as unknown as { __banners?: { at: number; items: Entry[] } }

async function walk(dir: string, rel: string[], out: Entry[]) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue
    if (e.isDirectory()) {
      await walk(path.join(dir, e.name), [...rel, e.name], out)
    } else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) {
      const parts = [...rel, e.name]
      const first = rel[0]?.toLowerCase()
      const slot = (SLOTS as readonly string[]).includes(first ?? "") ? (first as Slot) : null
      out.push({
        url: "/banners/" + parts.map(encodeURIComponent).join("/"),
        slot,
        ratio: ratioFromName(e.name),
      })    }
  }
}

async function listBanners(): Promise<Entry[]> {
  const now = Date.now()
  if (g.__banners && now - g.__banners.at < 60_000) return g.__banners.items
  const items: Entry[] = []
  await walk(path.join(process.cwd(), "public", "banners"), [], items)
  g.__banners = { at: now, items }
  return items
}

function currentSlot(tz: string): Slot {
  const h = hourIn(tz)
  if (h >= 5 && h < 11) return "morning"
  if (h >= 11 && h < 16) return "noon"
  if (h >= 16 && h < 20) return "evening"
  return "night"
}

/**
 * انتخاب تصادفی از همه تصاویر داخل public/banners.
 * اگر داخل پوشه‌هایی با نام morning / noon / evening / night عکس گذاشته باشی،
 * آن عکس‌ها فقط در بازه‌ی ساعتی خودشان کنار عکس‌های عمومی (بدون پوشه) نمایش داده می‌شوند.
 */
export async function pickBanner(
  tz = "Asia/Tehran"
): Promise<{ url: string; ratio: number } | null> {
  const all = await listBanners()
  if (all.length === 0) return null
  const slot = currentSlot(tz)
  const pool = all.filter((b) => b.slot === null || b.slot === slot)
  const list = pool.length > 0 ? pool : all
  const pick = list[Math.floor(Math.random() * list.length)]
  return { url: pick.url, ratio: pick.ratio }
}
