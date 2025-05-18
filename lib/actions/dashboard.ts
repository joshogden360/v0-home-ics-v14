"use server"
import { sql } from "@/lib/db"

export async function getDashboardStats() {
  try {
    // Use direct tagged template literals for simple queries
    const itemCount = await sql`SELECT COUNT(*) as count FROM items`
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`
    const mediaCount = await sql`SELECT COUNT(*) as count FROM media`

    // Use tagged template literals for more complex queries
    const upcomingMaintenance = await sql`
      SELECT m.maintenance_id, m.maintenance_type, m.next_due, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.next_due IS NOT NULL 
      AND m.next_due <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY m.next_due ASC
      LIMIT 5
    `

    const recentItems = await sql`
      SELECT item_id, name, category, created_at
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
        items: itemCount[0]?.count || 0,
        rooms: roomCount[0]?.count || 0,
        media: mediaCount[0]?.count || 0,
      },
      upcomingMaintenance: upcomingMaintenance || [],
      recentItems: recentItems || [],
      itemsByCategory: itemsByCategory || [],
      itemsByRoom: itemsByRoom || [],
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    // Return default values to prevent rendering errors
    return {
      counts: { items: 0, rooms: 0, media: 0 },
      upcomingMaintenance: [],
      recentItems: [],
      itemsByCategory: [],
      itemsByRoom: [],
    }
  }
}
