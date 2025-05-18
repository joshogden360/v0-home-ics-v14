import {
  getDocumentById,
  getDocumentVersions,
  getDocumentFiles,
  getDocumentRelations,
  deleteDocument,
} from "@/lib/actions/documents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Pencil, Trash2, ArrowLeft, History, FileText, Download, Eye, LinkIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentContent } from "./document-content"

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const documentId = Number.parseInt(params.id)
  const document = await getDocumentById(documentId)

  if (!document) {
    notFound()
  }

  const versions = await getDocumentVersions(documentId)
  const files = await getDocumentFiles(documentId)
  const relations = await getDocumentRelations(documentId)

  async function handleDeleteDocument() {
    "use server"

    const result = await deleteDocument(documentId)

    if (result.success) {
      redirect("/documentation")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/documentation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                className={
                  document.status === "published"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : document.status === "archived"
                      ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                }
              >
                {document.status || "draft"}
              </Badge>
              {document.category && (
                <Badge variant="outline" className="capitalize">
                  {document.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/documentation/${documentId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/documentation/${documentId}/new-version`}>
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              New Version
            </Button>
          </Link>
          <form action={handleDeleteDocument}>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      {document.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{document.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="relations">Relations</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DocumentContent content={document.content} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>Track changes to this document over time</CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length > 0 ? (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div key={version.version_id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2">
                            v{version.version_number}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{formatDate(version.created_at)}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/documentation/${documentId}/versions/${version.version_id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {version.change_notes && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Change Notes:</p>
                          <p className="text-muted-foreground">{version.change_notes}</p>
                        </div>
                      )}
                      {version.created_by && (
                        <div className="mt-1 text-xs text-muted-foreground">Created by: {version.created_by}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <History className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No version history available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attached Files</CardTitle>
              <CardDescription>Files and attachments for this document</CardDescription>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map((file) => (
                    <div key={file.file_id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size || 0)}</p>
                          </div>
                        </div>
                        <a href={file.file_path} download target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No files attached to this document</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Related Items</CardTitle>
              <CardDescription>Items, rooms, and maintenance tasks linked to this document</CardDescription>
            </CardHeader>
            <CardContent>
              {relations.length > 0 ? (
                <div className="space-y-6">
                  {relations.some((r) => r.relation_type === "item") && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Items</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {relations
                          .filter((r) => r.relation_type === "item")
                          .map((relation) => (
                            <Link
                              key={relation.relation_id}
                              href={`/items/${relation.related_id}`}
                              className="flex items-center p-2 rounded-md border hover:bg-muted transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{relation.related_name}</span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}

                  {relations.some((r) => r.relation_type === "room") && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Rooms</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {relations
                          .filter((r) => r.relation_type === "room")
                          .map((relation) => (
                            <Link
                              key={relation.relation_id}
                              href={`/rooms/${relation.related_id}`}
                              className="flex items-center p-2 rounded-md border hover:bg-muted transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{relation.related_name}</span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}

                  {relations.some((r) => r.relation_type === "maintenance") && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Maintenance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {relations
                          .filter((r) => r.relation_type === "maintenance")
                          .map((relation) => (
                            <Link
                              key={relation.relation_id}
                              href={`/maintenance/${relation.related_id}`}
                              className="flex items-center p-2 rounded-md border hover:bg-muted transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{relation.related_name}</span>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <LinkIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No relations for this document</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        <p>Created: {formatDate(document.created_at)}</p>
        <p>Last Updated: {formatDate(document.updated_at)}</p>
        {document.created_by && <p>Author: {document.created_by}</p>}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
