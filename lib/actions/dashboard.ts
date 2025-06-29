"use server"
import { sql } from "@/lib/db"
import type { Item, Maintenance } from "@/lib/types"

interface DashboardStats {
  counts: {
    items: number
    rooms: number
    media: number
    maintenance: number
  }
  upcomingMaintenance: Maintenance[]
  recentItems: Item[]
  itemsByCategory: { category: string; count: number }[]
  itemsByRoom: { room_name: string; count: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Use direct tagged template literals for simple queries
    const itemCount = await sql`SELECT COUNT(*) as count FROM items`
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`
    const mediaCount = await sql`SELECT COUNT(*) as count FROM media`
    const maintenanceCount = await sql`SELECT COUNT(*) as count FROM maintenance`

    // Use tagged template literals for more complex queries
    const upcomingMaintenance = await sql`
      SELECT m.maintenance_id, m.maintenance_type, m.next_due, m.created_at, m.updated_at,
             m.item_id, m.frequency_days, m.last_performed, m.instructions,
             i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.next_due IS NOT NULL 
      AND m.next_due <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY m.next_due ASC
      LIMIT 5
    `

    const recentItems = await sql`
      SELECT *
      FROM items
      ORDER BY created_at DESC
      LIMIT 5
    `

    const itemsByCategory = await sql`
      SELECT category, COUNT(*) as count
      FROM items
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `

    const itemsByRoom = await sql`
      SELECT r.name as room_name, COUNT(l.item_id) as count
      FROM rooms r
      LEFT JOIN locations l ON r.room_id = l.room_id
      GROUP BY r.room_id, r.name
      ORDER BY count DESC
    `

    return {
      counts: {
        items: Number(itemCount[0]?.count) || 0,
        rooms: Number(roomCount[0]?.count) || 0,
        media: Number(mediaCount[0]?.count) || 0,
        maintenance: Number(maintenanceCount[0]?.count) || 0,
      },
      upcomingMaintenance: upcomingMaintenance as Maintenance[] || [],
      recentItems: recentItems as Item[] || [],
      itemsByCategory: itemsByCategory.map(cat => ({
        category: cat.category,
        count: Number(cat.count)
      })) || [],
      itemsByRoom: itemsByRoom.map(room => ({
        room_name: room.room_name,
        count: Number(room.count)
      })) || [],
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    // Return default values to prevent rendering errors
    return {
      counts: { items: 0, rooms: 0, media: 0, maintenance: 0 },
      upcomingMaintenance: [],
      recentItems: [],
      itemsByCategory: [],
      itemsByRoom: [],
    }
  }
}
