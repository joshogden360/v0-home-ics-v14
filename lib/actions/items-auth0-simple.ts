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

export async function getItems() {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Query items with direct user_id filter (no RLS needed)
    const items = await sql`
      SELECT i.*, l.room_id, r.name as room_name
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
      WHERE i.user_id = ${userId}
      ORDER BY i.name ASC
    `
    return items
  } catch (error) {
    console.error("Error fetching items:", error)
    return []
  }
}

export async function getItemById(id: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Check if item belongs to user
    const items = await sql`
      SELECT * FROM items WHERE item_id = ${id} AND user_id = ${userId}
    `

    if (items.length === 0) {
      return null
    }

    const item = items[0]

    // Get related data
    const media = await sql`SELECT * FROM media WHERE item_id = ${id}`

    const locations = await sql`
      SELECT l.*, r.name as room_name, r.floor_number 
      FROM locations l
      JOIN rooms r ON l.room_id = r.room_id
      WHERE l.item_id = ${id}
    `

    const room = locations.length > 0 ? {
      room_id: locations[0].room_id,
      name: locations[0].room_name,
      floor_number: locations[0].floor_number,
    } : undefined

    const tags = await sql`
      SELECT t.* FROM tags t
      JOIN item_tags it ON t.tag_id = it.tag_id
      WHERE it.item_id = ${id}
    `

    const maintenance = await sql`
      SELECT * FROM maintenance WHERE item_id = ${id}
    `

    return {
      ...item,
      room,
      media,
      tags,
      maintenance,
    }
  } catch (error) {
    console.error("Error fetching item details:", error)
    return null
  }
}

export async function createItem(formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Extract form data
    const name = formData.get("name") as string
    if (!name || name.trim() === "") {
      return { success: false, error: "Item name is required" }
    }

    const data = Object.fromEntries(formData.entries()) as any

    // Create the item with user_id
    const result = await sql`
      INSERT INTO items (
        user_id, name, description, category, purchase_date, 
        purchase_price, condition, notes,
        purchased_from, serial_number, warranty_provider,
        warranty_expiration, storage_location, current_value,
        depreciation_rate, has_insurance, insurance_provider,
        insurance_policy, insurance_coverage, insurance_category,
        needs_maintenance, maintenance_interval, maintenance_instructions
      ) VALUES (
        ${userId}, ${name},
        ${data.description || null},
        ${data.category || null},
        ${data.purchase_date || null},
        ${data.purchase_price ? Number.parseFloat(data.purchase_price) : null},
        ${data.condition || null},
        ${data.notes || null},
        ${data.purchased_from || null},
        ${data.serial_number || null},
        ${data.warranty_provider || null},
        ${data.warranty_expiration || null},
        ${data.storage_location || null},
        ${data.current_value ? Number.parseFloat(data.current_value) : null},
        ${data.depreciation_rate ? Number.parseInt(data.depreciation_rate) : null},
        ${data.has_insurance === "true" ? true : false},
        ${data.insurance_provider || null},
        ${data.insurance_policy || null},
        ${data.insurance_coverage ? Number.parseFloat(data.insurance_coverage) : null},
        ${data.insurance_category || null},
        ${data.needs_maintenance === "true" ? true : false},
        ${data.maintenance_interval ? Number.parseInt(data.maintenance_interval) : null},
        ${data.maintenance_instructions || null}
      ) RETURNING item_id
    `

    const itemId = result[0]?.item_id
    if (!itemId) {
      return { success: false, error: "Failed to create item" }
    }

    // Handle room assignment
    if (data.room_id) {
      const roomId = Number.parseInt(data.room_id)
      await sql`
        INSERT INTO locations (item_id, room_id, notes)
        VALUES (${itemId}, ${roomId}, 'Initial placement')
      `
    }

    revalidatePath("/items")
    return { success: true, id: itemId }
  } catch (error) {
    console.error("Error creating item:", error)
    return { success: false, error: "Failed to create item: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function updateItem(id: number, formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Extract form data
    const name = formData.get("name") as string
    if (!name || name.trim() === "") {
      return { success: false, error: "Item name is required" }
    }

    const data = Object.fromEntries(formData.entries()) as any

    // Update the item only if it belongs to user
    const result = await sql`
      UPDATE items SET
        name = ${name},
        description = ${data.description || null},
        category = ${data.category || null},
        purchase_date = ${data.purchase_date || null},
        purchase_price = ${data.purchase_price ? Number.parseFloat(data.purchase_price) : null},
        condition = ${data.condition || null},
        notes = ${data.notes || null},
        purchased_from = ${data.purchased_from || null},
        serial_number = ${data.serial_number || null},
        warranty_provider = ${data.warranty_provider || null},
        warranty_expiration = ${data.warranty_expiration || null},
        storage_location = ${data.storage_location || null},
        current_value = ${data.current_value ? Number.parseFloat(data.current_value) : null},
        depreciation_rate = ${data.depreciation_rate ? Number.parseInt(data.depreciation_rate) : null},
        has_insurance = ${data.has_insurance === "true" ? true : false},
        insurance_provider = ${data.insurance_provider || null},
        insurance_policy = ${data.insurance_policy || null},
        insurance_coverage = ${data.insurance_coverage ? Number.parseFloat(data.insurance_coverage) : null},
        insurance_category = ${data.insurance_category || null},
        needs_maintenance = ${data.needs_maintenance === "true" ? true : false},
        maintenance_interval = ${data.maintenance_interval ? Number.parseInt(data.maintenance_interval) : null},
        maintenance_instructions = ${data.maintenance_instructions || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE item_id = ${id} AND user_id = ${userId}
      RETURNING item_id
    `

    if (result.length === 0) {
      return { success: false, error: "Item not found or access denied" }
    }

    // Handle room assignment via locations table
    if (data.room_id && data.room_id !== "none") {
      const roomId = Number.parseInt(data.room_id)
      
      // Check if location already exists
      const existingLocation = await sql`
        SELECT location_id FROM locations WHERE item_id = ${id}
      `

      if (existingLocation.length > 0) {
        // Update existing location
        await sql`
          UPDATE locations SET
            room_id = ${roomId},
            notes = 'Updated location',
            updated_at = CURRENT_TIMESTAMP
          WHERE item_id = ${id}
        `
      } else {
        // Create new location
        await sql`
          INSERT INTO locations (item_id, room_id, notes)
          VALUES (${id}, ${roomId}, 'Updated placement')
        `
      }
    } else {
      // Remove location if "none" selected
      await sql`
        DELETE FROM locations WHERE item_id = ${id}
      `
    }

    revalidatePath(`/items/${id}`)
    revalidatePath("/items")
    return { success: true, id }
  } catch (error) {
    console.error("Error updating item:", error)
    return { success: false, error: "Failed to update item: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function deleteItem(id: number) {
  try {
    const userId = await getAuthenticatedUserId()
    
    // Delete only if item belongs to user
    const deleteResult = await sql`
      DELETE FROM items WHERE item_id = ${id} AND user_id = ${userId} 
      RETURNING item_id
    `

    if (deleteResult.length === 0) {
      return { success: false, error: "Item not found or access denied" }
    }

    revalidatePath("/items")
    return { success: true }
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, error: "Failed to delete item" }
  }
} 