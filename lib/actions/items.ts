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
    // First, create the item
    const result = await sql`
      INSERT INTO items (
        name, description, category, purchase_date, 
        purchase_price, condition, notes
      ) VALUES (
        ${name},
        ${data.description || null},
        ${data.category || null},
        ${data.purchase_date || null},
        ${data.purchase_price ? Number.parseFloat(data.purchase_price) : null},
        ${data.condition || null},
        ${data.notes || null}
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
    const items = await sql`SELECT * FROM items WHERE item_id = ${id}`

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
