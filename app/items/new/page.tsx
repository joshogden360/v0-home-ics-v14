import { getRooms } from "@/lib/actions/rooms"
import { NewItemForm } from "./new-item-form"

export default async function NewItemPage() {
  // Fetch rooms for the form with error handling
  let rooms = []
  try {
    rooms = await getRooms()
  } catch (error) {
    console.error("Error fetching rooms:", error)
    // Continue with empty rooms array
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Item</h1>
        <p className="text-muted-foreground">Add a new item to your inventory</p>
      </div>

      <NewItemForm rooms={rooms} />
    </div>
  )
}
