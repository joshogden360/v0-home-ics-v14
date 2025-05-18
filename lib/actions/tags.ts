"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getTags() {
  try {
    const tags = await sql`
      SELECT t.*, COUNT(it.item_id) as item_count
      FROM tags t
      LEFT JOIN item_tags it ON t.tag_id = it.tag_id
      GROUP BY t.tag_id
      ORDER BY t.name ASC
    `
    return tags
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

export async function createTag(formData: FormData) {
  const name = formData.get("name") as string
  const color = formData.get("color") as string

  if (!name) {
    return { success: false, error: "Tag name is required" }
  }

  try {
    await sql`
      INSERT INTO tags (name, color)
      VALUES (${name}, ${color || "#94a3b8"})
    `

    revalidatePath("/tags")
    return { success: true }
  } catch (error) {
    console.error("Error creating tag:", error)
    return { success: false, error: "Failed to create tag" }
  }
}

export async function getTagById(id: number) {
  try {
    const tags = await sql`
      SELECT * FROM tags WHERE tag_id = ${id}
    `
    return tags.length > 0 ? tags[0] : null
  } catch (error) {
    console.error("Error fetching tag:", error)
    return null
  }
}

export async function updateTag(id: number, formData: FormData) {
  const name = formData.get("name") as string
  const color = formData.get("color") as string

  try {
    await sql`
      UPDATE tags
      SET name = ${name}, color = ${color}
      WHERE tag_id = ${id}
    `

    revalidatePath(`/tags/${id}`)
    revalidatePath("/tags")
    return { success: true }
  } catch (error) {
    console.error("Error updating tag:", error)
    return { success: false, error: "Failed to update tag" }
  }
}

export async function deleteTag(id: number) {
  try {
    // First delete all item_tags associations
    await sql`DELETE FROM item_tags WHERE tag_id = ${id}`
    // Then delete the tag
    await sql`DELETE FROM tags WHERE tag_id = ${id}`

    revalidatePath("/tags")
    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, error: "Failed to delete tag" }
  }
}

export async function getTagItems(tagId: number) {
  try {
    const items = await sql`
      SELECT i.* FROM items i
      JOIN item_tags it ON i.item_id = it.item_id
      WHERE it.tag_id = ${tagId}
      ORDER BY i.name ASC
    `
    return items
  } catch (error) {
    console.error("Error fetching tag items:", error)
    return []
  }
}

export async function addTagToItem(itemId: number, tagId: number) {
  try {
    await sql`
      INSERT INTO item_tags (item_id, tag_id)
      VALUES (${itemId}, ${tagId})
    `
    revalidatePath(`/items/${itemId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding tag to item:", error)
    return { success: false, error: "Failed to add tag to item" }
  }
}

export async function removeTagFromItem(itemId: number, tagId: number) {
  try {
    await sql`
      DELETE FROM item_tags
      WHERE item_id = ${itemId} AND tag_id = ${tagId}
    `
    revalidatePath(`/items/${itemId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing tag from item:", error)
    return { success: false, error: "Failed to remove tag from item" }
  }
}
