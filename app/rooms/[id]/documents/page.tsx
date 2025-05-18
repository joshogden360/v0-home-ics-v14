import { getRoomById } from "@/lib/actions/rooms"
import { getDocumentsByRelation } from "@/lib/actions/documents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function RoomDocumentsPage({
  params,
}: {
  params: { id: string }
}) {
  const roomId = Number.parseInt(params.id)
  const room = await getRoomById(roomId)

  if (!room) {
    notFound()
  }

  const documents = await getDocumentsByRelation("room", roomId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/rooms/${roomId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">Documentation for {room.name}</p>
          </div>
        </div>
        <Link href={`/documentation/new?room=${roomId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>

      {documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.document_id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                  <Badge
                    className={
                      doc.status === "published"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : doc.status === "archived"
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                  >
                    {doc.status || "draft"}
                  </Badge>
                </div>
                <CardDescription className="truncate">{doc.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{doc.category || "Uncategorized"}</span>
                  </div>
                  <Link href={`/documentation/${doc.document_id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Updated: {formatDate(doc.updated_at)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">There are no documents associated with this room yet</p>
            <Link href={`/documentation/new?room=${roomId}`}>
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
