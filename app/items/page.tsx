import { getItems } from "@/lib/actions/items-auth0-simple"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Plus } from "lucide-react"
import ItemsTable from "./items-table"

export default async function ItemsPage() {
  // Fetch items data (authentication handled internally)
  const items = await getItems()

  // Prepare the data for the client component
  const preparedItems = items.map((item) => ({
    id: item.item_id,
    name: item.name,
    category: item.category || "Uncategorized",
    purchaseDate: formatDate(item.purchase_date),
    purchasePrice: formatCurrency(item.purchase_price),
    condition: item.condition || "Unknown",
    viewUrl: `/items/${item.item_id}`,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Link href="/items/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <ItemsTable items={preparedItems} />
    </div>
  )
}
