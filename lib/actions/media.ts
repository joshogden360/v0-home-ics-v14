"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { put, del, list } from "@vercel/blob"

export async function uploadItemMedia(formData: FormData) {
  const itemId = Number.parseInt(formData.get("item_id") as string)
  const mediaType = formData.get("media_type") as string
  const description = formData.get("description") as string
  const file = formData.get("file") as File

  if (!file || !itemId || !mediaType) {
    return { success: false, error: "Missing required fields" }
  }

  try {
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
    const media = await sql`
      SELECT * FROM media
      WHERE item_id = ${itemId}
      ORDER BY created_at DESC
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
    // Get the file path before deleting
    const mediaResult = await sql`
      SELECT file_path, metadata FROM media
      WHERE media_id = ${mediaId}
    `

    if (mediaResult.length === 0) {
      return { success: false, error: "Media not found" }
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
