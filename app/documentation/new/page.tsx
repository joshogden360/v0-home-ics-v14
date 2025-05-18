import { NewDocumentForm } from "./new-document-form"
import { getItems } from "@/lib/actions/items"
import { getRooms } from "@/lib/actions/rooms"
import { getMaintenanceItems } from "@/lib/actions/maintenance"

export default async function NewDocumentPage() {
  // Fetch related entities for linking
  const items = await getItems()
  const rooms = await getRooms()
  const maintenanceItems = await getMaintenanceItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Document</h1>
        <p className="text-muted-foreground">Create a new document, manual, or guide</p>
      </div>

      <NewDocumentForm items={items} rooms={rooms} maintenanceItems={maintenanceItems} />
    </div>
  )
}
