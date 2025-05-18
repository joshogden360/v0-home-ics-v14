"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"

// Define a simplified room type for the client component
interface RoomTableItem {
  id: string
  name: string
  floor_number: number | null
  area_sqft: number | null
  url: string
}

export function RoomsTable({ rooms }: { rooms: RoomTableItem[] }) {
  const columns: ColumnDef<RoomTableItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={row.original.url} className="font-medium hover:underline">
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "floor_number",
      header: "Floor",
    },
    {
      accessorKey: "area_sqft",
      header: "Area (sq ft)",
      cell: ({ row }) => row.original.area_sqft || "Unknown",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={row.original.url}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ]

  return <DataTable columns={columns} data={rooms} searchKey="name" />
}
