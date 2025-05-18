"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"

// Define the type for our prepared item data
interface PreparedItem {
  id: number
  name: string
  category: string
  purchaseDate: string
  purchasePrice: string
  condition: string
  viewUrl: string
}

interface ItemsTableProps {
  items: PreparedItem[]
}

export default function ItemsTable({ items }: ItemsTableProps) {
  // Define columns with simple accessors and renderers
  const columns: ColumnDef<PreparedItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={row.original.viewUrl} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "purchaseDate",
      header: "Purchase Date",
    },
    {
      accessorKey: "purchasePrice",
      header: "Price",
    },
    {
      accessorKey: "condition",
      header: "Condition",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={row.original.viewUrl}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ]

  return <DataTable columns={columns} data={items} searchKey="name" />
}
