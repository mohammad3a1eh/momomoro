import Image from "next/image"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { getCurrentUser } from "@/lib/auth"
import { pickBanner } from "@/lib/banners"

/** بنر تصادفی از public/banners — همه‌ی عکس‌ها باید هم‌اندازه (پیشنهاد: ۱۸۰۰×۶۰۰) باشند */
export async function Banner() {
  const user = await getCurrentUser()
  const banner = await pickBanner(user?.timezone)
  if (!banner) return null

  return (
    <AspectRatio
      ratio={banner.ratio}
      className="w-full overflow-hidden bg-muted"
    >
      <Image
        src={banner.url}
        alt=""
        fill
        unoptimized
        priority
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover"
      />
    </AspectRatio>
  )
}
