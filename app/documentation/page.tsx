"use client"

import { getDocuments } from "@/lib/actions/documents"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Document } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; q?: string }
}) {
  const { category, status, q } = searchParams
  const documents = await getDocuments({ category, status, search: q })

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link href={`/documentation/${row.original.document_id}`} className="font-medium hover:underline">
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.category || "Uncategorized"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "draft"
        return (
          <Badge
            className={
              status === "published"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : status === "archived"
                  ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => formatDate(row.original.updated_at),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/documentation/${row.original.document_id}`}>
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
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-muted-foreground">Manage your documentation and manuals</p>
        </div>
        <Link href="/documentation/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>Filter documents by category, status, or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                defaultValue={q || ""}
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search)
                  if (e.target.value) {
                    params.set("q", e.target.value)
                  } else {
                    params.delete("q")
                  }
                  window.location.search = params.toString()
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                defaultValue={category || ""}
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value) {
                    params.set("category", value)
                  } else {
                    params.delete("category")
                  }
                  window.location.search = params.toString()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="specification">Specification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                defaultValue={status || ""}
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value) {
                    params.set("status", value)
                  } else {
                    params.delete("status")
                  }
                  window.location.search = params.toString()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 ? (
        <DataTable columns={columns} data={documents} searchKey="title" />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {q || category || status
                ? "Try adjusting your filters or search term"
                : "Get started by creating your first document"}
            </p>
            <Link href="/documentation/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
