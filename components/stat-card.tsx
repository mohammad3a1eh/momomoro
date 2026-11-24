import { Card, CardContent } from "@/components/ui/card"

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-bold text-foreground">{value}</span>
        {hint && <span className="text-xs text-primary">{hint}</span>}
      </CardContent>
    </Card>
  )
}
