import { getRooms } from "@/lib/actions/rooms"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Room } from "@/lib/types"

export default async function RoomsPage() {
  const rooms = await getRooms()

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={`/rooms/${row.original.room_id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "floor_number",
      header: "Floor",
    },
    {
      accessorKey: "area_sqft",
      header: "Area (sq ft)",
      cell: ({ row }) => row.original.area_sqft || "Unknown",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/rooms/${row.original.room_id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ]

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

      <DataTable columns={columns} data={rooms} searchKey="name" />
    </div>
  )
}
