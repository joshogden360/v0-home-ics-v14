"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

// Define the type for the processed room data
interface ProcessedRoom {
  id: number
  name: string
  floor: number
  area: string
  itemCount: number
  url: string
}

// Define the columns for the DataTable
const columns: ColumnDef<ProcessedRoom>[] = [
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
    accessorKey: "floor",
    header: "Floor",
  },
  {
    accessorKey: "area",
    header: "Area",
  },
  {
    accessorKey: "itemCount",
    header: "Items",
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

export function RoomsTable({ rooms }: { rooms: ProcessedRoom[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter rooms based on search query
  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable columns={columns} data={filteredRooms} />
    </div>
  )
}
