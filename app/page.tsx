import { getDashboardStats } from "@/lib/actions/dashboard-secure"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DoorOpen, Image, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export default async function Dashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your apartment inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.items}</div>
            <p className="text-xs text-muted-foreground">Items in your inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.rooms}</div>
            <p className="text-xs text-muted-foreground">Rooms in your apartment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.media}</div>
            <p className="text-xs text-muted-foreground">Images and documents</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Maintenance tasks due in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingMaintenance && stats.upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingMaintenance.map((maintenance) => (
                  <div key={maintenance.maintenance_id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{maintenance.item_name}</p>
                      <p className="text-sm text-muted-foreground">{maintenance.maintenance_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">Due: {formatDate(maintenance.next_due)}</div>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming maintenance tasks</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Recently added inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentItems && stats.recentItems.length > 0 ? (
              <div className="space-y-4">
                {stats.recentItems.map((item) => (
                  <div key={item.item_id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category || "Uncategorized"}</p>
                    </div>
                    <Link href={`/items/${item.item_id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items added yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.itemsByCategory && stats.itemsByCategory.length > 0 ? (
              <div className="space-y-4">
                {stats.itemsByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{category.category}</p>
                    <p className="text-sm text-muted-foreground">{category.count} items</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categorized items</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Items by Room</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.itemsByRoom && stats.itemsByRoom.length > 0 ? (
              <div className="space-y-4">
                {stats.itemsByRoom.map((room, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{room.room_name}</p>
                    <p className="text-sm text-muted-foreground">{room.count} items</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items assigned to rooms</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
