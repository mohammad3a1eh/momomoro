"use client"

import { useActionState } from "react"

import { updateSettingsAction } from "@/app/actions/settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type Props = { focus: number; short: number; long: number; every: number }

export function SettingsForm({ focus, short, long, every }: Props) {
  const [state, action, pending] = useActionState(updateSettingsAction, undefined)

  const fields = [
    { name: "focus", label: "مدت تمرکز (دقیقه)", value: focus, min: 1, max: 180 },
    { name: "short", label: "استراحت کوتاه (دقیقه)", value: short, min: 1, max: 60 },
    { name: "long", label: "استراحت بلند (دقیقه)", value: long, min: 1, max: 120 },
    { name: "every", label: "استراحت بلند بعد از چند دور", value: every, min: 2, max: 12 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>زمان‌بندی</CardTitle>
        <CardDescription>تغییرات از شروع تایمر بعدی اعمال می‌شود.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup className="gap-6">
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {state?.ok && (
              <Alert>
                <AlertDescription>تنظیمات ذخیره شد.</AlertDescription>
              </Alert>
            )}
            {fields.map((f) => (
              <Field key={f.name}>
                <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                <Input
                  id={f.name}
                  name={f.name}
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  step={1}
                  required
                  defaultValue={f.value}
                  dir="ltr"
                  className="text-left"
                />
                {f.name === "every" && (
                  <FieldDescription>مثلاً ۴ یعنی بعد از هر ۴ دور تمرکز، استراحت بلند پیشنهاد می‌شود.</FieldDescription>
                )}
              </Field>
            ))}
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              ذخیره
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
