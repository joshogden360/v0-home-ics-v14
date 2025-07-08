import { getTagById, getTagItems, deleteTag } from "@/lib/actions/tags-secure"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Pencil, Trash2, ArrowLeft } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { Item } from "@/lib/types"

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tagId = Number.parseInt(id)
  const tag = await getTagById(tagId)

  if (!tag) {
    notFound()
  }

  const items = await getTagItems(tagId)

  async function handleDeleteTag() {
    "use server"

    const result = await deleteTag(tagId)

    if (result.success) {
      redirect("/tags")
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tags">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full" style={{ backgroundColor: tag.color || "#cbd5e1" }} />
            <h1 className="text-3xl font-bold tracking-tight">{tag.name}</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/tags/${tagId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <form action={handleDeleteTag}>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items with this Tag</CardTitle>
          <CardDescription>Inventory items tagged with {tag.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <DataTable columns={columns} data={items} searchKey="name" />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No items found with this tag</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
