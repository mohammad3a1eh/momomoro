import type { Metadata, Viewport } from "next"
import { Vazirmatn } from "next/font/google"

import "./globals.css"
import { AppNav } from "@/components/app-nav"
import { PwaRegister } from "@/components/pwa-register"
import { DirectionProvider } from "@/components/ui/direction"
import { getCurrentUser } from "@/lib/auth"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "پومودورو", template: "%s · پومودورو" },
  description: "تایمر پومودورو با تسک، پروفایل عمومی و آمار تمرکز روزانه",
  applicationName: "پومودورو",
  appleWebApp: { capable: true, title: "پومودورو", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="fa" dir="rtl" className={`dark ${vazirmatn.variable} font-sans antialiased`} suppressHydrationWarning>
      <body>
        <DirectionProvider direction="rtl">
          <AppNav username={user?.username ?? null} />
          <main>{children}</main>
          <PwaRegister />
        </DirectionProvider>
      </body>
    </html>
  )
}
