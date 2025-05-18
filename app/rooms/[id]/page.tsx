import { getRoomById, getRoomItems, deleteRoom } from "@/lib/actions/rooms"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Pencil, Trash2, ArrowLeft, Package } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { Item } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/utils"

export default async function RoomDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const roomId = Number.parseInt(params.id)
  const room = await getRoomById(roomId)

  if (!room) {
    notFound()
  }

  const items = await getRoomItems(roomId)

  async function handleDeleteRoom() {
    "use server"

    const result = await deleteRoom(roomId)

    if (result.success) {
      redirect("/rooms")
    }
  }

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={`/items/${row.original.item_id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category || "Uncategorized",
    },
    {
      accessorKey: "purchase_date",
      header: "Purchase Date",
      cell: ({ row }) => formatDate(row.original.purchase_date),
    },
    {
      accessorKey: "purchase_price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.original.purchase_price),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/items/${row.original.item_id}`}>
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
        <div className="flex items-center space-x-4">
          <Link href="/rooms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/rooms/${roomId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <form action={handleDeleteRoom}>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="font-medium">Floor:</dt>
                <dd>{room.floor_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Area:</dt>
                <dd>{room.area_sqft ? `${room.area_sqft} sq ft` : "Unknown"}</dd>
              </div>
              <div className="pt-2">
                <dt className="font-medium">Description:</dt>
                <dd className="mt-1 whitespace-pre-wrap">{room.description || "No description"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items in this room</p>
                <p className="text-3xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items in this Room</CardTitle>
          <CardDescription>Inventory items located in {room.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={items} searchKey="name" />
        </CardContent>
      </Card>
    </div>
  )
}
