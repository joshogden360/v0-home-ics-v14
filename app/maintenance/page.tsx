import { getMaintenanceItems, getUpcomingMaintenance } from "@/lib/actions/maintenance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

export default async function MaintenancePage() {
  const allMaintenance = await getMaintenanceItems()
  // Use the fixed function with hardcoded 30 days
  const upcomingMaintenance = await getUpcomingMaintenance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground">Track and manage maintenance for your items</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Tasks due in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance) => (
                  <div
                    key={maintenance.maintenance_id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        <p className="font-medium">{maintenance.item_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{maintenance.maintenance_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Due: {formatDate(maintenance.next_due)}</p>
                      <Link href={`/maintenance/${maintenance.maintenance_id}`}>
                        <Button variant="ghost" size="sm" className="mt-1">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No upcoming maintenance</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Overview</CardTitle>
            <CardDescription>Status of all maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Upcoming</p>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{upcomingMaintenance.length}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Total</p>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{allMaintenance.length}</p>
                </div>
              </div>

              <Link href="/maintenance/new">
                <Button className="w-full">Add Maintenance Task</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {allMaintenance.length > 0 ? (
            <div className="space-y-4">
              {allMaintenance.map((maintenance) => (
                <div
                  key={maintenance.maintenance_id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{maintenance.item_name}</p>
                    <p className="text-sm text-muted-foreground">{maintenance.maintenance_type}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <p className="text-sm">
                        {maintenance.next_due ? (
                          <>Next due: {formatDate(maintenance.next_due)}</>
                        ) : (
                          <>Last performed: {formatDate(maintenance.last_performed)}</>
                        )}
                      </p>
                    </div>
                    <Link href={`/maintenance/${maintenance.maintenance_id}`}>
                      <Button variant="ghost" size="sm" className="mt-1">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No maintenance tasks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
