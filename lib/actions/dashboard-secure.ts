"use server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
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

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const userId = await getAuthenticatedUserId()

    // Get counts filtered by user
    const itemCount = await sql`
      SELECT COUNT(*) as count FROM items WHERE user_id = ${userId}
    `
    
    const roomCount = await sql`
      SELECT COUNT(*) as count FROM rooms WHERE user_id = ${userId}
    `
    
    const mediaCount = await sql`
      SELECT COUNT(*) as count FROM media m
      JOIN items i ON m.item_id = i.item_id
      WHERE i.user_id = ${userId}
    `
    
    const maintenanceCount = await sql`
      SELECT COUNT(*) as count FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE i.user_id = ${userId}
    `

    // Get upcoming maintenance for user's items only
    const upcomingMaintenance = await sql`
      SELECT m.maintenance_id, m.maintenance_type, m.next_due, m.created_at, m.updated_at,
             m.item_id, m.frequency_days, m.last_performed, m.instructions,
             i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE i.user_id = ${userId}
      AND m.next_due IS NOT NULL 
      AND m.next_due <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY m.next_due ASC
      LIMIT 5
    `

    // Get recent items for user only
    const recentItems = await sql`
      SELECT *
      FROM items
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `

    // Get items by category for user only
    const itemsByCategory = await sql`
      SELECT category, COUNT(*) as count
      FROM items
      WHERE user_id = ${userId} AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `

    // Get items by room for user only
    const itemsByRoom = await sql`
      SELECT r.name as room_name, COUNT(l.item_id) as count
      FROM rooms r
      LEFT JOIN locations l ON r.room_id = l.room_id
      LEFT JOIN items i ON l.item_id = i.item_id
      WHERE r.user_id = ${userId}
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