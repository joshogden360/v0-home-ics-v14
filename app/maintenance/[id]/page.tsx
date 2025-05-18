import { getMaintenanceById, getMaintenanceLogs, createMaintenanceLog } from "@/lib/actions/maintenance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const maintenanceId = Number.parseInt(params.id)
  const maintenance = await getMaintenanceById(maintenanceId)

  if (!maintenance) {
    notFound()
  }

  const logs = await getMaintenanceLogs(maintenanceId)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/maintenance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="font-medium">Item:</dt>
                <dd>
                  <Link href={`/items/${maintenance.item_id}`} className="hover:underline">
                    {maintenance.item_name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Type:</dt>
                <dd>{maintenance.maintenance_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Frequency:</dt>
                <dd>{maintenance.frequency_days ? `${maintenance.frequency_days} days` : "Not scheduled"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Last Performed:</dt>
                <dd>{formatDate(maintenance.last_performed)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Next Due:</dt>
                <dd>{formatDate(maintenance.next_due)}</dd>
              </div>
              <div className="pt-2">
                <dt className="font-medium">Instructions:</dt>
                <dd className="mt-1 whitespace-pre-wrap">{maintenance.instructions || "No instructions provided"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Maintenance</CardTitle>
            <CardDescription>Record a completed maintenance task</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createMaintenanceLog} className="space-y-4">
              <input type="hidden" name="maintenance_id" value={maintenanceId} />

              <div className="space-y-2">
                <Label htmlFor="performed_date">Date Performed</Label>
                <Input
                  id="performed_date"
                  name="performed_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performed_by">Performed By</Label>
                <Input id="performed_by" name="performed_by" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input id="cost" name="cost" type="number" step="0.01" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Log Maintenance
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>Previous maintenance logs</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.log_id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(log.performed_date)}</p>
                    </div>
                    {log.cost && <p className="text-sm font-medium">{formatCurrency(log.cost)}</p>}
                  </div>
                  <div className="mt-2">
                    {log.performed_by && <p className="text-sm">Performed by: {log.performed_by}</p>}
                    {log.notes && <p className="mt-1 text-sm text-muted-foreground">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No maintenance logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
