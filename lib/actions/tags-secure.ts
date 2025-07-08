"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"

// Helper to get user database ID from Auth0 ID
async function getUserIdFromAuth0(auth0Id: string): Promise<number | null> {
  try {
    const result = await sql`
      SELECT user_id FROM users WHERE auth0_id = ${auth0Id}
    `
    return result[0]?.user_id || null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

// Helper to ensure user is authenticated and get their database ID
async function getAuthenticatedUserId(): Promise<number> {
  const session = await getSession()
  if (!session?.auth0Id) {
    throw new Error('User not authenticated')
  }

  const userId = await getUserIdFromAuth0(session.auth0Id)
  if (!userId) {
    throw new Error('User not found in database')
  }

  return userId
}

export async function getTags() {
  try {
    const userId = await getAuthenticatedUserId()
    
    const tags = await sql`
      SELECT t.*, COUNT(it.item_id) as item_count
      FROM tags t
      LEFT JOIN item_tags it ON t.tag_id = it.tag_id
      WHERE t.user_id = ${userId}
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
  try {
    const userId = await getAuthenticatedUserId()
    const name = formData.get("name") as string
    const color = formData.get("color") as string

    if (!name) {
      return { success: false, error: "Tag name is required" }
    }

    await sql`
      INSERT INTO tags (user_id, name, color)
      VALUES (${userId}, ${name}, ${color || "#94a3b8"})
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
    const userId = await getAuthenticatedUserId()
    
    const tags = await sql`
      SELECT * FROM tags WHERE tag_id = ${id} AND user_id = ${userId}
    `
    return tags.length > 0 ? tags[0] : null
  } catch (error) {
    console.error("Error fetching tag:", error)
    return null
  }
}

export async function updateTag(id: number, formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    const name = formData.get("name") as string
    const color = formData.get("color") as string

    await sql`
      UPDATE tags
      SET name = ${name}, color = ${color}
      WHERE tag_id = ${id} AND user_id = ${userId}
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
    const userId = await getAuthenticatedUserId()
    
    // First delete all item_tags associations for user's tags only
    await sql`
      DELETE FROM item_tags 
      WHERE tag_id = ${id} 
      AND tag_id IN (SELECT tag_id FROM tags WHERE user_id = ${userId})
    `
    
    // Then delete the tag (only if user owns it)
    await sql`DELETE FROM tags WHERE tag_id = ${id} AND user_id = ${userId}`

    revalidatePath("/tags")
    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, error: "Failed to delete tag" }
  }
}

export async function getTagItems(tagId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    const items = await sql`
      SELECT i.* FROM items i
      JOIN item_tags it ON i.item_id = it.item_id
      JOIN tags t ON it.tag_id = t.tag_id
      WHERE it.tag_id = ${tagId} AND t.user_id = ${userId} AND i.user_id = ${userId}
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
    const userId = await getAuthenticatedUserId()
    
    // Verify both item and tag belong to user
    const itemCheck = await sql`
      SELECT item_id FROM items WHERE item_id = ${itemId} AND user_id = ${userId}
    `
    const tagCheck = await sql`
      SELECT tag_id FROM tags WHERE tag_id = ${tagId} AND user_id = ${userId}
    `
    
    if (itemCheck.length === 0 || tagCheck.length === 0) {
      return { success: false, error: "Item or tag not found or access denied" }
    }

    await sql`
      INSERT INTO item_tags (item_id, tag_id)
      VALUES (${itemId}, ${tagId})
      ON CONFLICT (item_id, tag_id) DO NOTHING
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
    const userId = await getAuthenticatedUserId()
    
    // Only remove if both item and tag belong to user
    await sql`
      DELETE FROM item_tags
      WHERE item_id = ${itemId} AND tag_id = ${tagId}
      AND item_id IN (SELECT item_id FROM items WHERE user_id = ${userId})
      AND tag_id IN (SELECT tag_id FROM tags WHERE user_id = ${userId})
    `
    revalidatePath(`/items/${itemId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing tag from item:", error)
    return { success: false, error: "Failed to remove tag from item" }
  }
} 