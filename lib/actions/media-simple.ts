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

export async function uploadItemMedia(formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    
    const itemId = Number.parseInt(formData.get("item_id") as string)
    const mediaType = formData.get("media_type") as string
    const description = formData.get("description") as string
    const file = formData.get("file") as File

    if (!file || !itemId || !mediaType) {
      return { success: false, error: "Missing required fields" }
    }

    // Check file size (limit to 5MB for database storage)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File too large. Maximum size is 5MB." }
    }

    // SECURITY: Verify item belongs to the authenticated user
    const itemCheck = await sql`
      SELECT item_id FROM items WHERE item_id = ${itemId} AND user_id = ${userId}
    `
    
    if (itemCheck.length === 0) {
      return { success: false, error: "Item not found or access denied" }
    }

    // Convert file to base64 for database storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Data}`

    // Save the file information to the database
    try {
      await sql`
        INSERT INTO media (
          item_id, media_type, file_path, file_name, file_size, mime_type, metadata
        ) VALUES (
          ${itemId},
          ${mediaType},
          ${dataUrl},
          ${file.name},
          ${file.size},
          ${file.type},
          ${description ? JSON.stringify({ description, storage: 'database' }) : JSON.stringify({ storage: 'database' })}
        )
      `
    } catch (error) {
      console.error("Error saving to database:", error)
      return { success: false, error: "Failed to save file information to database" }
    }

    revalidatePath(`/items/${itemId}`)
    return { success: true, itemId }
  } catch (error) {
    console.error("Error uploading media:", error)
    return {
      success: false,
      error: "Failed to upload media: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getItemMedia(itemId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // SECURITY: Only get media for items that belong to the authenticated user
    const media = await sql`
      SELECT m.* FROM media m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.item_id = ${itemId} AND i.user_id = ${userId}
      ORDER BY m.created_at DESC
    `

    console.log(
      `Found ${media.length} media items for item ${itemId}:`,
      media.map((m) => ({ id: m.media_id, path: m.file_path?.substring(0, 50) + '...', type: m.media_type })),
    )

    return media
  } catch (error) {
    console.error("Error fetching item media:", error)
    return []
  }
}

export async function deleteMedia(mediaId: number, itemId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // SECURITY: Delete media only if user owns the item
    const deleteResult = await sql`
      DELETE FROM media 
      WHERE media_id = ${mediaId} 
      AND item_id = ${itemId} 
      AND item_id IN (
        SELECT item_id FROM items WHERE user_id = ${userId}
      )
      RETURNING media_id
    `

    if (deleteResult.length === 0) {
      return { success: false, error: "Media not found or access denied" }
    }

    revalidatePath(`/items/${itemId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting media:", error)
    return { success: false, error: "Failed to delete media" }
  }
} 