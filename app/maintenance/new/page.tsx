import { getItems } from "@/lib/actions/items"
import { NewMaintenanceForm } from "./new-maintenance-form"

export default async function NewMaintenancePage() {
  // Fetch items on the server with error handling
  let items = []
  try {
    items = await getItems()
  } catch (error) {
    console.error("Error fetching items:", error)
    // Continue with empty items array
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Maintenance Task</h1>
        <p className="text-muted-foreground">Schedule maintenance for an item</p>
      </div>

      <NewMaintenanceForm items={items} />
    </div>
  )
}
