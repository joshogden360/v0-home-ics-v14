"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Item } from "@/lib/types"

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

export async function createItem(formData: FormData) {
  // Extract and validate the required fields
  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    console.error("Item name is required")
    return { success: false, error: "Item name is required" }
  }

  const data = Object.fromEntries(formData.entries()) as unknown as ItemFormData & { room_id?: string }

  try {
    // First, create the item with all fields
    const result = await sql`
      INSERT INTO items (
        name, description, category, purchase_date, 
        purchase_price, condition, notes,
        purchased_from, serial_number, warranty_provider,
        warranty_expiration, storage_location, current_value,
        depreciation_rate, has_insurance, insurance_provider,
        insurance_policy, insurance_coverage, insurance_category,
        needs_maintenance, maintenance_interval, maintenance_instructions
      ) VALUES (
        ${name},
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

    // Check if result exists and has the expected structure
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.error("Unexpected result structure:", result)
      return { success: false, error: "Failed to create item: Unexpected result structure" }
    }

    // Access the item_id safely
    const itemId = result[0]?.item_id

    if (!itemId) {
      console.error("Item ID not found in result:", result)
      return { success: false, error: "Failed to create item: Item ID not found" }
    }

    // If a room is selected, create a location entry
    if (data.room_id) {
      const roomId = Number.parseInt(data.room_id)
      await sql`
        INSERT INTO locations (
          item_id, room_id, notes
        ) VALUES (
          ${itemId},
          ${roomId},
          'Initial placement'
        )
      `
    }

    revalidatePath("/items")
    return { success: true, id: itemId }
  } catch (error) {
    console.error("Error creating item:", error)
    return {
      success: false,
      error: "Failed to create item: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function updateItem(id: number, formData: FormData) {
  // Extract and validate the required fields
  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    console.error("Item name is required")
    return { success: false, error: "Item name is required" }
  }

  const data = Object.fromEntries(formData.entries()) as unknown as ItemFormData & { room_id?: string }

  try {
    // Update the item with all fields
    await sql`
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
        maintenance_instructions = ${data.maintenance_instructions || null}
      WHERE item_id = ${id}
    `

    // Update room location if provided
    if (data.room_id) {
      const roomId = Number.parseInt(data.room_id)

      // Check if a location already exists for this item
      const existingLocations = await sql`
        SELECT location_id FROM locations WHERE item_id = ${id}
      `

      if (existingLocations.length > 0) {
        // Update existing location
        await sql`
          UPDATE locations SET
            room_id = ${roomId},
            notes = 'Updated location'
          WHERE item_id = ${id}
        `
      } else {
        // Create new location
        await sql`
          INSERT INTO locations (
            item_id, room_id, notes
          ) VALUES (
            ${id},
            ${roomId},
            'Initial placement'
          )
        `
      }
    }

    revalidatePath(`/items/${id}`)
    revalidatePath("/items")
    return { success: true, id }
  } catch (error) {
    console.error("Error updating item:", error)
    return {
      success: false,
      error: "Failed to update item: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function getItems() {
  try {
    // Updated query to use locations table for the room relationship
    const items = await sql`
      SELECT i.*, l.room_id, r.name as room_name
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
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
    const items = await sql`
      SELECT * FROM items WHERE item_id = ${id}
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

    const room =
      locations.length > 0
        ? {
            room_id: locations[0].room_id,
            name: locations[0].room_name,
            floor_number: locations[0].floor_number,
          }
        : undefined

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

export async function deleteItem(id: number) {
  try {
    await sql`DELETE FROM items WHERE item_id = ${id}`
    revalidatePath("/items")
    return { success: true }
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, error: "Failed to delete item" }
  }
}

export async function getItem(id: string): Promise<Item | null> {
  try {
    const [item] = await sql`
      SELECT i.*, l.room_id, r.name as room_name
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
      WHERE i.item_id = ${id}
    `
    return item || null
  } catch (error) {
    console.error("Error fetching item:", error)
    return null
  }
}

export async function getItemsByRoom(roomId: string): Promise<Item[]> {
  try {
    const items = await sql`
      SELECT i.*
      FROM items i
      JOIN locations l ON i.item_id = l.item_id
      WHERE l.room_id = ${roomId}
      ORDER BY i.name ASC
    `
    return items
  } catch (error) {
    console.error("Error fetching items by room:", error)
    return []
  }
}

export async function getItemsWithoutRoom(): Promise<Item[]> {
  try {
    const items = await sql`
      SELECT i.*
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      WHERE l.location_id IS NULL
      ORDER BY i.name ASC
    `
    return items
  } catch (error) {
    console.error("Error fetching items without room:", error)
    return []
  }
}
