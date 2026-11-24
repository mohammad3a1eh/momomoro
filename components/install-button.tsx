"use client"

import { useEffect, useState } from "react"
import { Check, Download, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          نصب روی گوشی
        </CardTitle>
        <CardDescription>
          {installed
            ? "برنامه روی این دستگاه نصب شده است."
            : deferred
              ? "با یک لمس مثل یک اپ معمولی روی صفحه‌ی اصلی نصب می‌شود."
              : ios
                ? "در Safari دکمه‌ی اشتراک‌گذاری (Share) را بزن و «Add to Home Screen» را انتخاب کن."
                : "از منوی مرورگر گزینه‌ی «نصب برنامه» یا «Add to Home screen» را بزن."}
        </CardDescription>
      </CardHeader>
      {(deferred || installed) && (
        <CardContent>
          {installed ? (
            <span className="flex items-center gap-2 text-sm text-primary">
              <Check className="size-4" /> نصب شده
            </span>
          ) : (
            <Button onClick={install}>
              <Download />
              نصب برنامه
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
