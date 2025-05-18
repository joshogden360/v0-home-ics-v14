"use client"

import { useState } from "react"
import { addTagToItem, removeTagFromItem } from "@/lib/actions/tags"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Tag } from "@/lib/types"

export function ItemTags({
  itemId,
  itemTags,
  allTags,
}: {
  itemId: number
  itemTags: Tag[]
  allTags: Tag[]
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>("")

  // Filter out tags that are already assigned to the item
  const availableTags = allTags.filter((tag) => !itemTags.some((itemTag) => itemTag.tag_id === tag.tag_id))

  async function handleAddTag() {
    if (!selectedTagId) return

    setIsAdding(true)
    try {
      await addTagToItem(itemId, Number.parseInt(selectedTagId))
      router.refresh()
      setSelectedTagId("")
    } catch (error) {
      console.error("Error adding tag:", error)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemoveTag(tagId: number) {
    try {
      await removeTagFromItem(itemId, tagId)
      router.refresh()
    } catch (error) {
      console.error("Error removing tag:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {itemTags.length > 0 ? (
          itemTags.map((tag) => (
            <Badge
              key={tag.tag_id}
              style={{
                backgroundColor: tag.color || undefined,
                color: tag.color ? getContrastColor(tag.color) : undefined,
              }}
              className="flex items-center gap-1 px-3 py-1"
            >
              {tag.name}
              <button onClick={() => handleRemoveTag(tag.tag_id)} className="ml-1 rounded-full hover:bg-black/10 p-0.5">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag.name} tag</span>
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tags assigned to this item</p>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedTagId} onValueChange={setSelectedTagId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map((tag) => (
                <SelectItem key={tag.tag_id} value={tag.tag_id.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color || "#cbd5e1" }} />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddTag} disabled={!selectedTagId || isAdding}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Remove the # if it exists
  const color = hexColor.replace("#", "")

  // Convert hex to RGB
  const r = Number.parseInt(color.substring(0, 2), 16)
  const g = Number.parseInt(color.substring(2, 4), 16)
  const b = Number.parseInt(color.substring(4, 6), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#ffffff"
}
