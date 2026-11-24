"use client"

import { useState, useTransition } from "react"
import { Globe, Lock, Plus, Trash2 } from "lucide-react"

import { archiveTaskAction, createTaskAction, setTaskPrivacyAction } from "@/app/actions/tasks"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

type TaskItem = { id: number; title: string; isPrivate: boolean }

export function TasksPanel({ tasks }: { tasks: TaskItem[] }) {
  const [title, setTitle] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await createTaskAction(title, isPrivate)
      if (!r.ok) setError(r.error ?? "خطا در ساخت تسک")
      else setTitle("")
    })
  }

  function togglePrivacy(t: TaskItem) {
    startTransition(async () => {
      const r = await setTaskPrivacyAction(t.id, !t.isPrivate)
      if (!r.ok) setError(r.error ?? "خطا")
    })
  }

  function remove(t: TaskItem) {
    startTransition(async () => {
      const r = await archiveTaskAction(t.id)
      if (!r.ok) setError(r.error ?? "خطا")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تسک‌ها</CardTitle>
        <CardDescription>
          تسک عمومی با اسمش در پروفایلت دیده می‌شود؛ تسک خصوصی برای بقیه فقط «تسک خصوصی» نشان داده می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اسم تسک جدید…"
              maxLength={80}
              aria-label="اسم تسک"
            />
            <Button type="submit" disabled={pending || title.trim().length === 0}>
              {pending ? <Spinner /> : <Plus />}
              افزودن
            </Button>
          </div>
          <Label className="w-fit gap-3">
            <Switch checked={isPrivate} onCheckedChange={(v) => setIsPrivate(!!v)} size="sm" />
            خصوصی
          </Label>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tasks.length === 0 ? (
          <Empty className="border p-6">
            <EmptyHeader>
              <EmptyTitle>هنوز تسکی نداری</EmptyTitle>
              <EmptyDescription>یک تسک بساز و موقع شروع تمرکز انتخابش کن.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {tasks.map((t) => (
              <Item key={t.id} variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="text-sm">{t.title}</ItemTitle>
                  <Badge variant={t.isPrivate ? "default" : "secondary"}>
                    {t.isPrivate ? <Lock /> : <Globe />}
                    {t.isPrivate ? "خصوصی" : "عمومی"}
                  </Badge>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => togglePrivacy(t)}
                    disabled={pending}
                    aria-label={t.isPrivate ? "عمومی کن" : "خصوصی کن"}
                  >
                    {t.isPrivate ? <Globe /> : <Lock />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(t)}
                    disabled={pending}
                    aria-label="حذف تسک"
                  >
                    <Trash2 />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  )
}
