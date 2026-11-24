"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogIn, Settings, Timer, User, UserPlus, Users } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

export function AppNav({ username }: { username: string | null }) {
  const pathname = usePathname()

  const items: NavItem[] = username
    ? [
        { href: "/", label: "تایمر", icon: Timer },
        { href: "/live", label: "فعال‌ها", icon: Users },
        { href: `/u/${username}`, label: "پروفایل", icon: User },
        { href: "/settings", label: "تنظیمات", icon: Settings },
      ]
    : [
        { href: "/live", label: "فعال‌ها", icon: Users },
        { href: "/login", label: "ورود", icon: LogIn },
        { href: "/register", label: "ثبت‌نام", icon: UserPlus },
      ]

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href={username ? "/" : "/live"} className="flex items-center gap-2 font-bold">
            <span className="size-3 rounded-full bg-primary" aria-hidden />
            پومودورو
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: isActive(item.href) ? "secondary" : "ghost", size: "sm" }),
                  isActive(item.href) && "text-primary"
                )}
              >
                <item.icon />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <nav
        aria-label="ناوبری اصلی"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-safe md:hidden"
      >
        <ul className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
