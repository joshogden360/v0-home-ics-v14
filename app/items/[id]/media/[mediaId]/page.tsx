import { getItemById } from "@/lib/actions/items-auth0-simple"
import { deleteMedia } from "@/lib/actions/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Trash2, FileText, ImageIcon, Music, Video } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { sql } from "@/lib/db"

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string; mediaId: string }>
}) {
  const { id, mediaId: mediaIdParam } = await params
  const itemId = Number.parseInt(id)
  const mediaId = Number.parseInt(mediaIdParam)

  const item = await getItemById(itemId)
  if (!item) {
    notFound()
  }

  const mediaResult = await sql`
    SELECT * FROM media
    WHERE media_id = ${mediaId} AND item_id = ${itemId}
  `
  const media = mediaResult[0]

  if (!media) {
    notFound()
  }

  async function handleDeleteMedia() {
    "use server"

    const result = await deleteMedia(mediaId, itemId)

    if (result.success) {
      redirect(`/items/${itemId}`)
    }
  }

  const isImage = media.media_type.startsWith("image")
  const isPDF = media.media_type === "application/pdf" || media.file_path.endsWith(".pdf")
  const isVideo = media.media_type.startsWith("video")
  const isAudio = media.media_type.startsWith("audio")

  // Function to check if a URL is a Vercel Blob URL
  function isBlobUrl(url: string) {
    return url && url.includes("vercel-storage.com")
  }

  // Parse metadata if it's a string
  let metadata = media.metadata
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata)
    } catch (e) {
      metadata = {}
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/items/${itemId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{media.file_name}</h1>
        </div>
        <div className="flex space-x-2">
          <a href={media.file_path} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </a>
          <form action={handleDeleteMedia}>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            {isImage && isBlobUrl(media.file_path) ? (
              <div className="overflow-hidden rounded-md max-h-[70vh]">
                <img
                  src={media.file_path || "/placeholder.svg"}
                  alt={media.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            ) : isPDF && isBlobUrl(media.file_path) ? (
              <iframe src={media.file_path} className="w-full h-[70vh] border-0 rounded-md" title={media.file_name} />
            ) : isVideo && isBlobUrl(media.file_path) ? (
              <video
                controls
                className="max-w-full max-h-[70vh]"
                src={media.file_path}
              />
            ) : isAudio && isBlobUrl(media.file_path) ? (
              <audio
                controls
                className="w-full"
                src={media.file_path}
              />
            ) : (
              <div className="overflow-hidden rounded-md max-h-[70vh] flex items-center justify-center bg-muted p-8">
                <div className="text-center">
                  {isImage ? (
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  ) : isPDF ? (
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  ) : isVideo ? (
                    <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  ) : isAudio ? (
                    <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  )}
                  <h3 className="text-lg font-medium mb-2">{media.file_name}</h3>
                  {isBlobUrl(media.file_path) ? (
                    <a
                      href={media.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open file in new tab
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">Preview not available for this file type</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="font-medium">File Name:</dt>
              <dd>{media.file_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">File Type:</dt>
              <dd>{media.media_type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">File Size:</dt>
              <dd>{formatFileSize(media.file_size)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Uploaded:</dt>
              <dd>{formatDate(media.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Storage:</dt>
              <dd>{isBlobUrl(media.file_path) ? "Vercel Blob" : "Local Storage"}</dd>
            </div>
            {metadata && metadata.description && (
              <div className="pt-2">
                <dt className="font-medium">Description:</dt>
                <dd className="mt-1 whitespace-pre-wrap">{metadata.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
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
