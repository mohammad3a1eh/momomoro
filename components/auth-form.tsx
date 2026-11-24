"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"

import { loginAction, registerAction } from "@/app/actions/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register"
  const [state, action, pending] = useActionState(isRegister ? registerAction : loginAction, undefined)
  const [tz, setTz] = useState("")

  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isRegister ? "ساخت حساب" : "ورود"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "فقط با نام کاربری و رمز عبور؛ بدون ایمیل و شماره."
            : "برای استفاده از تایمر وارد شو. دیدن پروفایل‌ها نیازی به ورود ندارد."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup className="gap-6">
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="username">نام کاربری</FieldLabel>
              <Input
                id="username"
                name="username"
                dir="ltr"
                className="text-left"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                defaultValue={state?.username ?? ""}
                placeholder="mohammad_1"
              />
              {isRegister && (
                <FieldDescription>۳ تا ۲۰ کاراکتر؛ حروف انگلیسی، عدد و _</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                className="text-left"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                minLength={isRegister ? 8 : undefined}
              />
            </Field>

            {isRegister && (
              <>
                <Field>
                  <FieldLabel htmlFor="confirm">تکرار رمز عبور</FieldLabel>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    dir="ltr"
                    className="text-left"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <FieldDescription>
                    راهی برای بازیابی حساب وجود ندارد. اگر رمزت را فراموش کنی، حسابت از دست می‌رود.
                  </FieldDescription>
                </Field>
                <input type="hidden" name="timezone" value={tz} />
              </>
            )}

            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              {isRegister ? "ساخت حساب" : "ورود"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? "حساب داری؟ " : "حساب نداری؟ "}
              <Link href={isRegister ? "/login" : "/register"} className="text-primary underline underline-offset-4">
                {isRegister ? "ورود" : "ثبت‌نام"}
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
