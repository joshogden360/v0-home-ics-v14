import { getRooms } from "@/lib/actions/rooms"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { RoomsTable } from "./rooms-table"

export default async function RoomsPage() {
  const rooms = await getRooms()

  // Pre-process the rooms data for the client component
  const roomsData = rooms.map((room) => ({
    id: room.room_id.toString(),
    name: room.name,
    floor_number: room.floor_number,
    area_sqft: room.area_sqft,
    url: `/rooms/${room.room_id}`,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground">Manage your apartment rooms</p>
        </div>
        <Link href="/rooms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </Link>
      </div>

      <RoomsTable rooms={roomsData} />
    </div>
  )
}
