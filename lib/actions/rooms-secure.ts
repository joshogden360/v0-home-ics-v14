"use server"

import { sql } from "@/lib/db"
import type { Room } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
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

export async function getRooms(): Promise<Room[]> {
  try {
    const userId = await getAuthenticatedUserId()
    
    const rooms = await sql`
      SELECT r.*, COUNT(l.item_id) as item_count
      FROM rooms r
      LEFT JOIN locations l ON r.room_id = l.room_id
      LEFT JOIN items i ON l.item_id = i.item_id AND i.user_id = ${userId}
      WHERE r.user_id = ${userId}
      GROUP BY r.room_id
      ORDER BY r.floor_number ASC, r.name ASC
    `
    return rooms as Room[]
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return []
  }
}

export async function getRoomById(id: number): Promise<Room | null> {
  try {
    const userId = await getAuthenticatedUserId()
    
    const rooms = await sql`
      SELECT * FROM rooms WHERE room_id = ${id} AND user_id = ${userId}
    `

    return rooms.length > 0 ? rooms[0] as Room : null
  } catch (error) {
    console.error("Error fetching room details:", error)
    return null
  }
}

export async function getRoomItems(roomId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // First verify the room belongs to the user
    const roomCheck = await sql`
      SELECT room_id FROM rooms WHERE room_id = ${roomId} AND user_id = ${userId}
    `
    
    if (roomCheck.length === 0) {
      throw new Error('Room not found or access denied')
    }
    
    const items = await sql`
      SELECT i.* FROM items i
      JOIN locations l ON i.item_id = l.item_id
      WHERE l.room_id = ${roomId} AND i.user_id = ${userId}
      ORDER BY i.name ASC
    `

    return items
  } catch (error) {
    console.error("Error fetching room items:", error)
    return []
  }
}

export async function getRoomMedia(roomId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // First verify the room belongs to the user
    const roomCheck = await sql`
      SELECT room_id FROM rooms WHERE room_id = ${roomId} AND user_id = ${userId}
    `
    
    if (roomCheck.length === 0) {
      throw new Error('Room not found or access denied')
    }
    
    const media = await sql`
      SELECT * FROM room_media
      WHERE room_id = ${roomId}
      ORDER BY created_at DESC
    `
    return media
  } catch (error) {
    console.error("Error fetching room media:", error)
    return []
  }
}

export async function getRoomDocuments(roomId: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // First verify the room belongs to the user
    const roomCheck = await sql`
      SELECT room_id FROM rooms WHERE room_id = ${roomId} AND user_id = ${userId}
    `
    
    if (roomCheck.length === 0) {
      throw new Error('Room not found or access denied')
    }
    
    const documents = await sql`
      SELECT * FROM room_documents
      WHERE room_id = ${roomId}
      ORDER BY created_at DESC
    `
    return documents
  } catch (error) {
    console.error("Error fetching room documents:", error)
    return []
  }
}

export async function createRoom(formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Extract and validate the required fields
    const name = formData.get("name") as string

    if (!name || name.trim() === "") {
      console.error("Room name is required")
      return { success: false, error: "Room name is required" }
    }

    // Extract basic room details
    const description = formData.get("description") as string
    const floorNumber = formData.get("floor_number") as string
    const areaSqft = formData.get("area_sqft") as string
    const roomType = formData.get("room_type") as string

    // Extract room characteristics
    const hasCloset = formData.get("has_closet") === "on"
    const wallColor = formData.get("wall_color") as string
    const wallColorHex = formData.get("wall_color_hex") as string
    const flooringType = formData.get("flooring_type") as string
    const windowCount = formData.get("window_count") as string
    const windowWidth = formData.get("window_width") as string
    const windowHeight = formData.get("window_height") as string
    const ceilingLights = formData.get("ceiling_lights") as string
    const wallLights = formData.get("wall_lights") as string
    const identifyingFeatures = formData.get("identifying_features") as string

    // Extract maintenance information
    const lastCleaned = formData.get("last_cleaned") as string
    const cleaningFrequency = formData.get("cleaning_frequency") as string
    const paintingNeeded = formData.get("painting_needed") as string
    const airFilterLocation = formData.get("air_filter_location") as string
    const maintenanceNotes = formData.get("maintenance_notes") as string

    console.log("Creating room with name:", name, "for user:", userId)

    // Create the room with user_id
    const result = await sql`
      INSERT INTO rooms (
        user_id, name, description, floor_number, area_sqft, room_type,
        has_closet, wall_color, wall_color_hex, flooring_type,
        window_count, window_width, window_height,
        ceiling_lights, wall_lights, identifying_features,
        last_cleaned, cleaning_frequency, painting_needed,
        air_filter_location, maintenance_notes
      ) VALUES (
        ${userId},
        ${name},
        ${description || null},
        ${Number.parseInt(floorNumber) || 1},
        ${areaSqft ? Number.parseFloat(areaSqft) : null},
        ${roomType || null},
        ${hasCloset},
        ${wallColor || null},
        ${wallColorHex || null},
        ${flooringType || null},
        ${windowCount ? Number.parseInt(windowCount) : 0},
        ${windowWidth ? Number.parseFloat(windowWidth) : null},
        ${windowHeight ? Number.parseFloat(windowHeight) : null},
        ${ceilingLights || null},
        ${wallLights || null},
        ${identifyingFeatures || null},
        ${lastCleaned || null},
        ${cleaningFrequency ? Number.parseInt(cleaningFrequency) : null},
        ${paintingNeeded || null},
        ${airFilterLocation || null},
        ${maintenanceNotes || null}
      ) RETURNING room_id
    `

    const roomId = result[0].room_id

    // Process and store floorplan if provided
    const floorplanFile = formData.get("floorplan") as File
    if (floorplanFile && floorplanFile.size > 0) {
      const filename = `room-${roomId}-floorplan-${Date.now()}-${floorplanFile.name}`
      const blob = await put(filename, floorplanFile, {
        access: "public",
      })

      await sql`
        INSERT INTO room_media (
          room_id, file_path, file_type, file_name, content_type, description
        ) VALUES (
          ${roomId},
          ${blob.url},
          'floorplan',
          ${floorplanFile.name},
          ${floorplanFile.type},
          'Room floorplan'
        )
      `
    }

    // Process and store photos if provided
    for (let i = 0; formData.get(`photo_${i}`); i++) {
      const photo = formData.get(`photo_${i}`) as File
      if (photo && photo.size > 0) {
        const filename = `room-${roomId}-photo-${i}-${Date.now()}-${photo.name}`
        const blob = await put(filename, photo, {
          access: "public",
        })

        await sql`
          INSERT INTO room_media (
            room_id, file_path, file_type, file_name, content_type, description
          ) VALUES (
            ${roomId},
            ${blob.url},
            'photo',
            ${photo.name},
            ${photo.type},
            'Room photo'
          )
        `
      }
    }

    // Process and store documents if provided
    for (let i = 0; formData.get(`document_${i}`); i++) {
      const document = formData.get(`document_${i}`) as File
      if (document && document.size > 0) {
        const filename = `room-${roomId}-document-${i}-${Date.now()}-${document.name}`
        const blob = await put(filename, document, {
          access: "public",
        })

        // Get document types if selected
        const documentTypes = formData.getAll("document_types") as string[]
        const documentType = documentTypes.length > 0 ? documentTypes.join(", ") : "other"

        await sql`
          INSERT INTO room_documents (
            room_id, file_path, file_name, document_type, notes
          ) VALUES (
            ${roomId},
            ${blob.url},
            ${document.name},
            ${documentType},
            ${(formData.get("document_notes") as string) || null}
          )
        `
      }
    }

    // Process selected items if any - ensure items belong to user
    for (let i = 0; formData.get(`item_${i}`); i++) {
      const itemId = Number.parseInt(formData.get(`item_${i}`) as string)
      if (!isNaN(itemId)) {
        // Verify item belongs to user before linking
        const itemCheck = await sql`
          SELECT item_id FROM items WHERE item_id = ${itemId} AND user_id = ${userId}
        `
        
        if (itemCheck.length > 0) {
          await sql`
            INSERT INTO locations (
              item_id, room_id, notes
            ) VALUES (
              ${itemId},
              ${roomId},
              'Added during room creation'
            )
          `
        }
      }
    }

    revalidatePath("/rooms")
    return { success: true, id: roomId }
  } catch (error) {
    console.error("Error creating room:", error)
    return {
      success: false,
      error: "Failed to create room: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function updateRoom(id: number, formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // First verify the room belongs to the user
    const roomCheck = await sql`
      SELECT room_id FROM rooms WHERE room_id = ${id} AND user_id = ${userId}
    `
    
    if (roomCheck.length === 0) {
      return { success: false, error: "Room not found or access denied" }
    }
    
    // Extract and validate the required fields
    const name = formData.get("name") as string

    if (!name || name.trim() === "") {
      console.error("Room name is required")
      return { success: false, error: "Room name is required" }
    }

    // Extract basic room details
    const description = formData.get("description") as string
    const floorNumber = formData.get("floor_number") as string
    const areaSqft = formData.get("area_sqft") as string
    const roomType = formData.get("room_type") as string

    // Extract room characteristics
    const hasCloset = formData.get("has_closet") === "on"
    const wallColor = formData.get("wall_color") as string
    const wallColorHex = formData.get("wall_color_hex") as string
    const flooringType = formData.get("flooring_type") as string
    const windowCount = formData.get("window_count") as string
    const windowWidth = formData.get("window_width") as string
    const windowHeight = formData.get("window_height") as string
    const ceilingLights = formData.get("ceiling_lights") as string
    const wallLights = formData.get("wall_lights") as string
    const identifyingFeatures = formData.get("identifying_features") as string

    // Extract maintenance information
    const lastCleaned = formData.get("last_cleaned") as string
    const cleaningFrequency = formData.get("cleaning_frequency") as string
    const paintingNeeded = formData.get("painting_needed") as string
    const airFilterLocation = formData.get("air_filter_location") as string
    const maintenanceNotes = formData.get("maintenance_notes") as string

    // Update the room (user_id filter already verified above)
    await sql`
      UPDATE rooms SET
        name = ${name},
        description = ${description || null},
        floor_number = ${Number.parseInt(floorNumber) || 1},
        area_sqft = ${areaSqft ? Number.parseFloat(areaSqft) : null},
        room_type = ${roomType || null},
        has_closet = ${hasCloset},
        wall_color = ${wallColor || null},
        wall_color_hex = ${wallColorHex || null},
        flooring_type = ${flooringType || null},
        window_count = ${windowCount ? Number.parseInt(windowCount) : 0},
        window_width = ${windowWidth ? Number.parseFloat(windowWidth) : null},
        window_height = ${windowHeight ? Number.parseFloat(windowHeight) : null},
        ceiling_lights = ${ceilingLights || null},
        wall_lights = ${wallLights || null},
        identifying_features = ${identifyingFeatures || null},
        last_cleaned = ${lastCleaned || null},
        cleaning_frequency = ${cleaningFrequency ? Number.parseInt(cleaningFrequency) : null},
        painting_needed = ${paintingNeeded || null},
        air_filter_location = ${airFilterLocation || null},
        maintenance_notes = ${maintenanceNotes || null}
      WHERE room_id = ${id}
    `

    // Process and store floorplan if provided
    const floorplanFile = formData.get("floorplan") as File
    if (floorplanFile && floorplanFile.size > 0) {
      const filename = `room-${id}-floorplan-${Date.now()}-${floorplanFile.name}`
      const blob = await put(filename, floorplanFile, {
        access: "public",
      })

      await sql`
        INSERT INTO room_media (
          room_id, file_path, file_type, file_name, content_type, description
        ) VALUES (
          ${id},
          ${blob.url},
          'floorplan',
          ${floorplanFile.name},
          ${floorplanFile.type},
          'Room floorplan'
        )
      `
    }

    // Process and store new photos if provided
    for (let i = 0; formData.get(`photo_${i}`); i++) {
      const photo = formData.get(`photo_${i}`) as File
      if (photo && photo.size > 0) {
        const filename = `room-${id}-photo-${i}-${Date.now()}-${photo.name}`
        const blob = await put(filename, photo, {
          access: "public",
        })

        await sql`
          INSERT INTO room_media (
            room_id, file_path, file_type, file_name, content_type, description
          ) VALUES (
            ${id},
            ${blob.url},
            'photo',
            ${photo.name},
            ${photo.type},
            'Room photo'
          )
        `
      }
    }

    // Process and store new documents if provided
    for (let i = 0; formData.get(`document_${i}`); i++) {
      const document = formData.get(`document_${i}`) as File
      if (document && document.size > 0) {
        const filename = `room-${id}-document-${i}-${Date.now()}-${document.name}`
        const blob = await put(filename, document, {
          access: "public",
        })

        // Get document types if selected
        const documentTypes = formData.getAll("document_types") as string[]
        const documentType = documentTypes.length > 0 ? documentTypes.join(", ") : "other"

        await sql`
          INSERT INTO room_documents (
            room_id, file_path, file_name, document_type, notes
          ) VALUES (
            ${id},
            ${blob.url},
            ${document.name},
            ${documentType},
            ${(formData.get("document_notes") as string) || null}
          )
        `
      }
    }

    // Handle item assignments - ensure items belong to user
    const currentItems = await getRoomItems(id)
    const currentItemIds = currentItems.map((item) => item.item_id)

    // Get the new item IDs from the form
    const newItemIds: number[] = []
    for (let i = 0; formData.get(`item_${i}`); i++) {
      const itemId = Number.parseInt(formData.get(`item_${i}`) as string)
      if (!isNaN(itemId)) {
        // Verify item belongs to user
        const itemCheck = await sql`
          SELECT item_id FROM items WHERE item_id = ${itemId} AND user_id = ${userId}
        `
        
        if (itemCheck.length > 0) {
          newItemIds.push(itemId)
        }
      }
    }

    // Items to add (in newItemIds but not in currentItemIds)
    const itemsToAdd = newItemIds.filter((itemId) => !currentItemIds.includes(itemId))

    // Items to remove (in currentItemIds but not in newItemIds)
    const itemsToRemove = currentItemIds.filter((itemId) => !newItemIds.includes(itemId))

    // Add new items
    for (const itemId of itemsToAdd) {
      await sql`
        INSERT INTO locations (
          item_id, room_id, notes
        ) VALUES (
          ${itemId},
          ${id},
          'Added during room update'
        )
      `
    }

    // Remove items no longer in the room
    for (const itemId of itemsToRemove) {
      await sql`
        DELETE FROM locations
        WHERE item_id = ${itemId} AND room_id = ${id}
      `
    }

    revalidatePath(`/rooms/${id}`)
    revalidatePath("/rooms")
    return { success: true }
  } catch (error) {
    console.error("Error updating room:", error)
    return { success: false, error: "Failed to update room" }
  }
}

export async function deleteRoom(id: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Delete only if room belongs to user
    const deleteResult = await sql`
      DELETE FROM rooms WHERE room_id = ${id} AND user_id = ${userId}
      RETURNING room_id
    `
    
    if (deleteResult.length === 0) {
      return { success: false, error: "Room not found or access denied" }
    }
    
    revalidatePath("/rooms")
    return { success: true }
  } catch (error) {
    console.error("Error deleting room:", error)
    return { success: false, error: "Failed to delete room" }
  }
} 