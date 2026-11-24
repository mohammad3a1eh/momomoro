let ctx: AudioContext | null = null

export function primeAudio() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    if (!ctx) ctx = new AC()
    if (ctx.state === "suspended") void ctx.resume()
  } catch {
    /* ignore */
  }
}

export function playChime() {
  const c = ctx
  if (!c) return
  try {
    const t = c.currentTime
    const notes = [880, 660, 880]
    notes.forEach((freq, i) => {
      const start = t + i * 0.28
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(start)
      osc.stop(start + 0.26)
    })
  } catch {
    /* ignore */
  }
}

export function requestNotifyPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission()
    }
  } catch {
    /* ignore */
  }
}

export async function notify(title: string, body: string) {
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* ignore */
  }
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "pomodoro",
        dir: "rtl",
        lang: "fa",
      })
      return
    }
    new Notification(title, { body, icon: "/icons/icon-192.png" })
  } catch {
    /* ignore */
  }
}
