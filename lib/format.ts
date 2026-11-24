const FA = "۰۱۲۳۴۵۶۷۸۹"

export function fa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => FA[Number(d)])
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${fa(m)} دقیقه`
  if (m === 0) return `${fa(h)} ساعت`
  return `${fa(h)} ساعت و ${fa(m)} دقیقه`
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor(s / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return fa(`${mm}:${ss}`)
}
