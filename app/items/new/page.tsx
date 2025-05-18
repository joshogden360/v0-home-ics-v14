import { getRooms } from "@/lib/actions/rooms"
import { NewItemForm } from "./new-item-form"

export default async function NewItemPage() {
  // Fetch rooms for the form
  const rooms = await getRooms().catch(() => [])

  return (
    <div className="container py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Item</h1>
        <p className="text-muted-foreground">Add a new item to your inventory</p>
      </div>

      <NewItemForm rooms={rooms} />
    </div>
  )
}
