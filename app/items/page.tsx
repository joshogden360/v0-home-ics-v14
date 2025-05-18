import { getItems } from "@/lib/actions/items"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Item } from "@/lib/types"

export default async function ItemsPage() {
  // Fetch items data
  const items = await getItems()

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
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => row.original.condition || "Unknown",
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

      <DataTable columns={columns} data={items} searchKey="name" />
    </div>
  )
}
