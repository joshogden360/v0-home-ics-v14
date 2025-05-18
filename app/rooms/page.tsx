import { getRooms } from "@/lib/actions/rooms"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { RoomsTable } from "./rooms-table"

export default async function RoomsPage() {
  // Fetch rooms data on the server
  const rooms = await getRooms()

  // Pre-process the data for the client component
  const processedRooms = rooms.map((room) => ({
    id: room.room_id,
    name: room.name,
    floor: room.floor_number,
    area: room.area_sqft ? `${room.area_sqft} sq ft` : "Unknown",
    itemCount: room.item_count || 0,
    url: `/rooms/${room.room_id}`,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <Link href="/rooms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rooms</CardTitle>
          <CardDescription>Manage your apartment rooms and spaces</CardDescription>
        </CardHeader>
        <CardContent>
          <RoomsTable rooms={processedRooms} />
        </CardContent>
      </Card>
    </div>
  )
}
