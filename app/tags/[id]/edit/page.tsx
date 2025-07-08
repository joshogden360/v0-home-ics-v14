import { getTagById } from "@/lib/actions/tags-secure"
import { EditTagForm } from "./edit-tag-form"
import { notFound } from "next/navigation"
import type { Tag } from "@/lib/types"

export default async function EditTagPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Tag</h1>
        <p className="text-muted-foreground">Update tag details</p>
      </div>

      <EditTagForm tag={tag as Tag} />
    </div>
  )
}
