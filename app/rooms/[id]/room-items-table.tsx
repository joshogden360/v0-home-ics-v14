"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { Item } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/utils"

interface RoomItemsTableProps {
  items: Item[]
}

export function RoomItemsTable({ items }: RoomItemsTableProps) {
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

  return <DataTable columns={columns} data={items} searchKey="name" />
} 