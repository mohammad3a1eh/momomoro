export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** کلید روز به‌صورت YYYY-MM-DD در منطقه زمانی داده‌شده */
export function dayKey(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number)
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

const fullFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
const shortFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
const fullYearFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

function toUtcNoon(day: string) {
  return new Date(`${day}T12:00:00Z`)
}

export function dayLabelShort(day: string) {
  return shortFmt.format(toUtcNoon(day))
}
export function dayLabelFull(day: string) {
  return fullFmt.format(toUtcNoon(day))
}
export function formatDateFa(date: Date) {
  return fullYearFmt.format(date)
}

/** ساعت (۰–۲۳) در منطقه زمانی */
export function hourIn(tz: string, date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date)
  return Number(h) % 24
}
