"use server"

import { neon } from "@neondatabase/serverless"
import type { Item } from "@/lib/types"

const sql = neon(process.env.DATABASE_URL!)

export async function getItems(): Promise<Item[]> {
  const items = await sql`
    SELECT 
      i.*, 
      r.name as room_name
    FROM 
      items i
    LEFT JOIN 
      rooms r ON i.room_id = r.room_id
    ORDER BY 
      i.name ASC
  `
  return items
}

export async function getItemById(id: number): Promise<Item | null> {
  const [item] = await sql`
    SELECT 
      i.*, 
      r.name as room_name
    FROM 
      items i
    LEFT JOIN 
      rooms r ON i.room_id = r.room_id
    WHERE 
      i.item_id = ${id}
  `
  return item || null
}

export async function getItem(id: string): Promise<Item | null> {
  const [item] = await sql`
    SELECT 
      i.*, 
      r.name as room_name
    FROM 
      items i
    LEFT JOIN 
      rooms r ON i.room_id = r.room_id
    WHERE 
      i.item_id = ${id}
  `
  return item || null
}

export async function createItem(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const roomId = formData.get("roomId") as string
  const purchaseDate = formData.get("purchaseDate") as string
  const purchasePrice = Number.parseFloat(formData.get("purchasePrice") as string)
  const condition = formData.get("condition") as string
  const notes = formData.get("notes") as string

  const [item] = await sql`
    INSERT INTO items (
      name, 
      description, 
      category, 
      room_id, 
      purchase_date, 
      purchase_price, 
      condition, 
      notes
    ) 
    VALUES (
      ${name}, 
      ${description}, 
      ${category}, 
      ${roomId || null}, 
      ${purchaseDate || null}, 
      ${purchasePrice || null}, 
      ${condition}, 
      ${notes}
    )
    RETURNING *
  `

  return item
}

export async function updateItem(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const roomId = formData.get("roomId") as string
  const purchaseDate = formData.get("purchaseDate") as string
  const purchasePrice = Number.parseFloat(formData.get("purchasePrice") as string)
  const condition = formData.get("condition") as string
  const notes = formData.get("notes") as string

  const [item] = await sql`
    UPDATE items
    SET 
      name = ${name}, 
      description = ${description}, 
      category = ${category}, 
      room_id = ${roomId || null}, 
      purchase_date = ${purchaseDate || null}, 
      purchase_price = ${purchasePrice || null}, 
      condition = ${condition}, 
      notes = ${notes}
    WHERE 
      item_id = ${id}
    RETURNING *
  `

  return item
}

export async function deleteItem(id: string) {
  await sql`DELETE FROM items WHERE item_id = ${id}`
  return { success: true }
}

export async function getItemsByRoom(roomId: string): Promise<Item[]> {
  const items = await sql`
    SELECT * FROM items
    WHERE room_id = ${roomId}
    ORDER BY name ASC
  `
  return items
}

export async function getItemsWithoutRoom(): Promise<Item[]> {
  const items = await sql`
    SELECT * FROM items
    WHERE room_id IS NULL
    ORDER BY name ASC
  `
  return items
}
