import Link from "next/link"

import { PageShell } from "@/components/page-shell"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default function NotFound() {
  return (
    <PageShell banner={true}>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>صفحه پیدا نشد</EmptyTitle>
          <EmptyDescription>چنین صفحه یا کاربری وجود ندارد.</EmptyDescription>
        </EmptyHeader>
        <Link href="/" className={buttonVariants()}>
          بازگشت
        </Link>
      </Empty>
    </PageShell>
  )
}
