import { getItemById, deleteItem } from "@/lib/actions/items"
import { getItemMedia } from "@/lib/actions/media"
import { getTags } from "@/lib/actions/tags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Pencil, Trash2, ArrowLeft, Plus, FileText, Music, Video, ImageIcon } from "lucide-react"
import { ItemTags } from "./item-tags"

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const itemId = Number.parseInt(params.id)
  const item = await getItemById(itemId)
  const media = await getItemMedia(itemId)
  const allTags = await getTags()

  if (!item) {
    notFound()
  }

  async function handleDeleteItem() {
    "use server"

    const result = await deleteItem(itemId)

    if (result.success) {
      redirect("/items")
    }
  }

  function getMediaIcon(mediaType: string) {
    if (mediaType.startsWith("image")) return <ImageIcon className="h-4 w-4" />
    if (mediaType.startsWith("audio")) return <Music className="h-4 w-4" />
    if (mediaType.startsWith("video")) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  // Function to check if a URL is a Vercel Blob URL
  function isBlobUrl(url: string) {
    return url && url.includes("vercel-blob.com")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/items">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/items/${itemId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <form action={handleDeleteItem}>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="font-medium">Category:</dt>
                <dd>{item.category || "Uncategorized"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Purchase Date:</dt>
                <dd>{formatDate(item.purchase_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Purchase Price:</dt>
                <dd>{formatCurrency(item.purchase_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Condition:</dt>
                <dd>{item.condition || "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Location:</dt>
                <dd>{item.room ? item.room.name : "Unassigned"}</dd>
              </div>
              <div className="pt-2">
                <dt className="font-medium">Description:</dt>
                <dd className="mt-1 whitespace-pre-wrap">{item.description || "No description"}</dd>
              </div>
              {item.notes && (
                <div className="pt-2">
                  <dt className="font-medium">Notes:</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{item.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Media</CardTitle>
              <CardDescription>Images and documents related to this item</CardDescription>
            </div>
            <Link href={`/items/${itemId}/media/add`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Media
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {media && media.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {media.map((mediaItem) => (
                  <Link
                    key={mediaItem.media_id}
                    href={`/items/${itemId}/media/${mediaItem.media_id}`}
                    className="overflow-hidden rounded-md border block relative"
                  >
                    {mediaItem.media_type.startsWith("image") ? (
                      <div className="relative aspect-square bg-muted">
                        {isBlobUrl(mediaItem.file_path) ? (
                          <img
                            src={mediaItem.file_path || "/placeholder.svg"}
                            alt={mediaItem.file_name || "Item image"}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error("Image failed to load:", mediaItem.file_path)
                              e.currentTarget.src = "/colorful-abstract-flow.png"
                              e.currentTarget.alt = "Image not available"
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 h-full w-full">
                            <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                            <p className="text-xs text-center text-muted-foreground">
                              {mediaItem.file_name || "Image File"}
                            </p>
                          </div>
                        )}

                        {/* Show file name at the bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
                          {mediaItem.file_name || "Unnamed file"}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-muted p-4">
                        <div className="text-center">
                          {getMediaIcon(mediaItem.media_type)}
                          <p className="mt-2 text-sm text-muted-foreground truncate max-w-full">
                            {mediaItem.file_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No media files</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Categorize this item with tags</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ItemTags itemId={itemId} itemTags={item.tags || []} allTags={allTags} />
        </CardContent>
      </Card>

      {item.maintenance && item.maintenance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>Maintenance schedule and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {item.maintenance.map((maintenance) => (
                <div key={maintenance.maintenance_id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{maintenance.maintenance_type}</h3>
                    <Link href={`/maintenance/${maintenance.maintenance_id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Last Performed</p>
                      <p>{formatDate(maintenance.last_performed)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Due</p>
                      <p>{formatDate(maintenance.next_due)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p>{maintenance.frequency_days ? `${maintenance.frequency_days} days` : "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
