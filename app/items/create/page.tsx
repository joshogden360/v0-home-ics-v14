import { getRooms } from "@/lib/actions/rooms"
import { PhotoToItemsMinimal } from "@/components/ai/photo-to-items-minimal"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function CreateItemsPage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  // Fetch rooms for the form with error handling
  let rooms: any[] = []
  try {
    rooms = await getRooms()
  } catch (error) {
    console.error("Error fetching rooms:", error)
    // Continue with empty rooms array
  }

  return <PhotoToItemsMinimal rooms={rooms} />
} 