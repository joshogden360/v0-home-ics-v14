import { getItemById } from "@/lib/actions/items"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaUploadForm } from "./media-upload-form"

export default async function AddMediaPage({ params }: { params: { id: string } }) {
  const itemId = Number.parseInt(params.id)
  const item = await getItemById(itemId)

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/items/${itemId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Media</h1>
      </div>
      <p className="text-muted-foreground">Upload images or documents for {item.name}</p>

      <MediaUploadForm itemId={itemId} itemName={item.name} />
    </div>
  )
}
