import { getItemById } from "@/lib/actions/items-auth0-simple"
import { getRooms } from "@/lib/actions/rooms-secure"
import EditItemForm from "./edit-item-form"
import { notFound } from "next/navigation"

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const itemId = Number.parseInt(id, 10)
  const item = await getItemById(itemId)
  const rooms = await getRooms()

  if (!item) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Item</h1>
      <EditItemForm item={item} rooms={rooms} />
    </div>
  )
}
