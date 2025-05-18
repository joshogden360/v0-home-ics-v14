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

  // Define the columns configuration
  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        // Pre-compute the href to avoid passing functions to client components
        const href = `/items/${row.original.item_id}`
        const name = row.original.name
        return (
          <Link href={href} className="font-medium hover:underline">
            {name}
          </Link>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        // Pre-compute the value to avoid passing functions
        return row.original.category || "Uncategorized"
      },
    },
    {
      accessorKey: "purchase_date",
      header: "Purchase Date",
      cell: ({ row }) => {
        // Pre-compute the formatted date
        const formattedDate = formatDate(row.original.purchase_date)
        return formattedDate
      },
    },
    {
      accessorKey: "purchase_price",
      header: "Price",
      cell: ({ row }) => {
        // Pre-compute the formatted price
        const formattedPrice = formatCurrency(row.original.purchase_price)
        return formattedPrice
      },
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => {
        // Pre-compute the value
        return row.original.condition || "Unknown"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        // Pre-compute the href
        const href = `/items/${row.original.item_id}`
        return (
          <Link href={href}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        )
      },
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
