"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { put, del, list } from "@vercel/blob"
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

    // SECURITY: Verify item belongs to the authenticated user
    const itemCheck = await sql`
      SELECT item_id FROM items WHERE item_id = ${itemId} AND user_id = ${userId}
    `
    
    if (itemCheck.length === 0) {
      return { success: false, error: "Item not found or access denied" }
    }
    // Create a unique filename
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`.toLowerCase()
    const folderPath = `item-${itemId}`

    // Upload file to Vercel Blob
    const blob = await put(`${folderPath}/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false, // We already added a timestamp
      cacheControlMaxAge: 31536000, // 1 year in seconds
    })

    console.log("File uploaded to Vercel Blob:", blob.url)

    // Save the file information to the database
    try {
      await sql`
        INSERT INTO media (
          item_id, media_type, file_path, file_name, file_size, mime_type, metadata
        ) VALUES (
          ${itemId},
          ${mediaType},
          ${blob.url},
          ${file.name},
          ${file.size},
          ${file.type},
          ${description ? JSON.stringify({ description, blobId: blob.url }) : JSON.stringify({ blobId: blob.url })}
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

    // Log media items for debugging
    console.log(
      `Found ${media.length} media items for item ${itemId}:`,
      media.map((m) => ({ id: m.media_id, path: m.file_path, type: m.media_type })),
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
    
    // SECURITY: Get the file path before deleting, but only if user owns the item
    const mediaResult = await sql`
      SELECT m.file_path, m.metadata FROM media m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.media_id = ${mediaId} AND m.item_id = ${itemId} AND i.user_id = ${userId}
    `

    if (mediaResult.length === 0) {
      return { success: false, error: "Media not found or access denied" }
    }

    const media = mediaResult[0]

    // Delete from Vercel Blob if it's a blob URL
    if (media.file_path && media.file_path.includes("vercel-blob.com")) {
      try {
        await del(media.file_path)
        console.log("Deleted file from Vercel Blob:", media.file_path)
      } catch (error) {
        console.error("Error deleting from Vercel Blob:", error)
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete from database
    await sql`DELETE FROM media WHERE media_id = ${mediaId}`

    revalidatePath(`/items/${itemId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting media:", error)
    return { success: false, error: "Failed to delete media" }
  }
}

// New function to list all media for an item using Vercel Blob
export async function listItemBlobMedia(itemId: number) {
  try {
    const folderPath = `item-${itemId}`
    const blobs = await list({ prefix: folderPath })
    return blobs
  } catch (error) {
    console.error("Error listing blobs:", error)
    return { blobs: [] }
  }
}
