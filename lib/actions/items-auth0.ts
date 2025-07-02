"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { withUserContext } from "@/lib/auth0-rls"
import type { Item } from "@/lib/types"
import type { DetectedItem } from "@/lib/services/ai-service"

export type ItemFormData = {
  name: string
  description: string
  category: string
  purchase_date: string
  purchase_price: string
  condition: string
  notes: string
  // New fields
  purchased_from: string
  serial_number: string
  warranty_provider: string
  warranty_expiration: string
  storage_location: string
  current_value: string
  depreciation_rate: string
  has_insurance: string
  insurance_provider: string
  insurance_policy: string
  insurance_coverage: string
  insurance_category: string
  needs_maintenance: string
  maintenance_interval: string
  maintenance_instructions: string
}

export async function createItem(formData: FormData, auth0UserId: string) {
  // Extract and validate the required fields
  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    console.error("Item name is required")
    return { success: false, error: "Item name is required" }
  }

  if (!auth0UserId) {
    return { success: false, error: "User authentication required" }
  }

  const data = Object.fromEntries(formData.entries()) as unknown as ItemFormData & { room_id?: string }

  try {
    return await withUserContext(auth0UserId, async () => {
      // Get the current user's database ID
      const userResult = await sql`
        SELECT user_id FROM users WHERE auth0_id = ${auth0UserId}
      `

      if (userResult.length === 0) {
        throw new Error("User not found")
      }

      const userId = userResult[0].user_id

      // Create the item with user_id for RLS
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

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error("Failed to create item: Unexpected result structure")
      }

      const itemId = result[0]?.item_id

      if (!itemId) {
        throw new Error("Failed to create item: Item ID not found")
      }

      // If a room is selected, update the item's room_id
      if (data.room_id) {
        const roomId = Number.parseInt(data.room_id)
        await sql`
          UPDATE items SET room_id = ${roomId} WHERE item_id = ${itemId}
        `
      }

      revalidatePath("/items")
      return { success: true, id: itemId }
    })
  } catch (error) {
    console.error("Error creating item:", error)
    return {
      success: false,
      error: "Failed to create item: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function updateItem(id: number, formData: FormData, auth0UserId: string) {
  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    return { success: false, error: "Item name is required" }
  }

  if (!auth0UserId) {
    return { success: false, error: "User authentication required" }
  }

  const data = Object.fromEntries(formData.entries()) as unknown as ItemFormData & { room_id?: string }

  try {
    return await withUserContext(auth0UserId, async () => {
      // Update the item - RLS will ensure user can only update their own items
      const updateResult = await sql`
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
          room_id = ${data.room_id ? Number.parseInt(data.room_id) : null}
        WHERE item_id = ${id}
        RETURNING item_id
      `

      if (updateResult.length === 0) {
        throw new Error("Item not found or access denied")
      }

      revalidatePath(`/items/${id}`)
      revalidatePath("/items")
      return { success: true, id }
    })
  } catch (error) {
    console.error("Error updating item:", error)
    return {
      success: false,
      error: "Failed to update item: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getItems(auth0UserId: string) {
  if (!auth0UserId) {
    return []
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // RLS will automatically filter to user's items only
      const items = await sql`
        SELECT i.*, r.name as room_name, r.floor_number
        FROM items i
        LEFT JOIN rooms r ON i.room_id = r.room_id
        ORDER BY i.name ASC
      `
      return items
    })
  } catch (error) {
    console.error("Error fetching items:", error)
    return []
  }
}

export async function getItemById(id: number, auth0UserId: string) {
  if (!auth0UserId) {
    return null
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // RLS will ensure user can only access their own items
      const items = await sql`
        SELECT * FROM items WHERE item_id = ${id}
      `

      if (items.length === 0) {
        return null
      }

      const item = items[0]

      // Get related data (RLS will filter these too)
      const media = await sql`SELECT * FROM media WHERE item_id = ${id}`

      const room = item.room_id ? await sql`
        SELECT room_id, name, floor_number 
        FROM rooms 
        WHERE room_id = ${item.room_id}
      ` : []

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
        room: room.length > 0 ? room[0] : undefined,
        media,
        tags,
        maintenance,
      }
    })
  } catch (error) {
    console.error("Error fetching item details:", error)
    return null
  }
}

export async function deleteItem(id: number, auth0UserId: string) {
  if (!auth0UserId) {
    return { success: false, error: "User authentication required" }
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // RLS will ensure user can only delete their own items
      const deleteResult = await sql`
        DELETE FROM items WHERE item_id = ${id} RETURNING item_id
      `

      if (deleteResult.length === 0) {
        throw new Error("Item not found or access denied")
      }

      revalidatePath("/items")
      return { success: true }
    })
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, error: "Failed to delete item" }
  }
}

export async function getItemsByRoom(roomId: string, auth0UserId: string): Promise<Item[]> {
  if (!auth0UserId) {
    return []
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // RLS will ensure user can only see their own items
      const items = await sql`
        SELECT i.*
        FROM items i
        WHERE i.room_id = ${roomId}
        ORDER BY i.name ASC
      `
      return items as Item[]
    })
  } catch (error) {
    console.error("Error fetching items by room:", error)
    return []
  }
}

export async function getItemsWithoutRoom(auth0UserId: string): Promise<Item[]> {
  if (!auth0UserId) {
    return []
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // RLS will ensure user can only see their own items
      const items = await sql`
        SELECT i.*
        FROM items i
        WHERE i.room_id IS NULL
        ORDER BY i.name ASC
      `
      return items as Item[]
    })
  } catch (error) {
    console.error("Error fetching items without room:", error)
    return []
  }
}

export async function addItemFromDetection(detectedItem: DetectedItem, auth0UserId: string) {
  if (!auth0UserId) {
    return { success: false, error: "User authentication required" }
  }

  try {
    return await withUserContext(auth0UserId, async () => {
      // Get the current user's database ID
      const userResult = await sql`
        SELECT user_id FROM users WHERE auth0_id = ${auth0UserId}
      `

      if (userResult.length === 0) {
        throw new Error("User not found")
      }

      const userId = userResult[0].user_id

      // Extract information from the detected item
      const name = detectedItem.boundingBox.label || `${detectedItem.category} Item`
      const description = detectedItem.description
      const category = detectedItem.category
      const condition = detectedItem.metadata?.condition || 'Unknown'
      const estimatedValue = detectedItem.metadata?.estimatedValue
      
      // Parse estimated value if available
      let currentValue = null
      if (estimatedValue) {
        const valueMatch = estimatedValue.match(/\$?(\d+(?:\.\d+)?)/);
        if (valueMatch) {
          currentValue = parseFloat(valueMatch[1]);
        }
      }

      // Create the item with user_id for RLS
      const result = await sql`
        INSERT INTO items (
          user_id, name, description, category, condition, current_value,
          notes, created_at
        ) VALUES (
          ${userId}, ${name}, ${description}, ${category}, ${condition}, ${currentValue},
          ${`Detected via AI analysis. Additional metadata: ${JSON.stringify(detectedItem.metadata || {})}`},
          NOW()
        ) RETURNING item_id
      `

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error("Failed to create item: Unexpected result structure")
      }

      const itemId = result[0]?.item_id
      if (!itemId) {
        throw new Error("Failed to create item: Item ID not found")
      }

      revalidatePath("/items")
      return { success: true, id: itemId }
    })
  } catch (error) {
    console.error("Error creating item from detection:", error)
    return {
      success: false,
      error: "Failed to create item: " + (error instanceof Error ? error.message : String(error)),
    }
  }
} 