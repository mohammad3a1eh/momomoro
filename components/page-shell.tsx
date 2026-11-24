import { Banner } from "@/components/banner"
import { cn } from "@/lib/utils"

export function PageShell({
  children,
  className,
  banner = true,
}: {
  children: React.ReactNode
  className?: string
  banner?: boolean
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-28 md:pb-12", className)}>
      {banner && <Banner />}
      {children}
    </div>
  )
}
