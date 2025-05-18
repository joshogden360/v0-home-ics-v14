"use server"

import { sql } from "@/lib/db"
import type { Room, RoomFormData } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function getRooms(): Promise<Room[]> {
  try {
    const rooms = await sql`
      SELECT * FROM rooms
      ORDER BY floor_number ASC, name ASC
    `
    return rooms
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return []
  }
}

export async function getRoomById(id: number): Promise<Room | null> {
  try {
    const rooms = await sql`
      SELECT * FROM rooms WHERE room_id = ${id}
    `

    return rooms.length > 0 ? rooms[0] : null
  } catch (error) {
    console.error("Error fetching room details:", error)
    return null
  }
}

export async function getRoomItems(roomId: number) {
  try {
    const items = await sql`
      SELECT i.* FROM items i
      JOIN locations l ON i.item_id = l.item_id
      WHERE l.room_id = ${roomId}
      ORDER BY i.name ASC
    `

    return items
  } catch (error) {
    console.error("Error fetching room items:", error)
    return []
  }
}

export async function createRoom(formData: FormData) {
  // Extract and validate the required fields
  const name = formData.get("name") as string

  if (!name || name.trim() === "") {
    console.error("Room name is required")
    return { success: false, error: "Room name is required" }
  }

  const description = formData.get("description") as string
  const floorNumber = formData.get("floor_number") as string
  const areaSqft = formData.get("area_sqft") as string

  try {
    console.log("Creating room with name:", name)

    const result = await sql`
      INSERT INTO rooms (
        name, description, floor_number, area_sqft
      ) VALUES (
        ${name},
        ${description || null},
        ${Number.parseInt(floorNumber) || 1},
        ${areaSqft ? Number.parseFloat(areaSqft) : null}
      ) RETURNING room_id
    `

    revalidatePath("/rooms")
    return { success: true, id: result[0].room_id }
  } catch (error) {
    console.error("Error creating room:", error)
    return {
      success: false,
      error: "Failed to create room: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function updateRoom(id: number, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as unknown as RoomFormData

  try {
    await sql`
      UPDATE rooms SET
        name = ${data.name},
        description = ${data.description || null},
        floor_number = ${Number.parseInt(data.floor_number) || 1},
        area_sqft = ${data.area_sqft ? Number.parseFloat(data.area_sqft) : null}
      WHERE room_id = ${id}
    `

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
    await sql`DELETE FROM rooms WHERE room_id = ${id}`
    revalidatePath("/rooms")
    return { success: true }
  } catch (error) {
    console.error("Error deleting room:", error)
    return { success: false, error: "Failed to delete room" }
  }
}
