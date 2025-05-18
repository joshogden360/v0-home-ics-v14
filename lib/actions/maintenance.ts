"use server"

import { sql } from "@/lib/db"
import type { Maintenance, MaintenanceLog } from "@/lib/types"
import { revalidatePath } from "next/cache"

export async function getMaintenanceItems(): Promise<Maintenance[]> {
  try {
    const maintenance = await sql`
      SELECT m.*, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      ORDER BY m.next_due ASC NULLS LAST
    `
    return maintenance
  } catch (error) {
    console.error("Error fetching maintenance items:", error)
    return []
  }
}

export async function getUpcomingMaintenance(days = 30): Promise<Maintenance[]> {
  try {
    // Convert the interval to a string outside the SQL query
    // This avoids the parameter binding issue
    const maintenance = await sql`
      SELECT m.*, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.next_due IS NOT NULL 
      AND m.next_due <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY m.next_due ASC
    `
    return maintenance
  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error)
    return []
  }
}

export async function getUpcomingMaintenanceWithDays(days: number): Promise<Maintenance[]> {
  try {
    // For dynamic days, we need to use a different approach
    // We'll calculate the date directly in JavaScript and pass it as a parameter
    const currentDate = new Date()
    const futureDate = new Date()
    futureDate.setDate(currentDate.getDate() + days)

    const futureDateStr = futureDate.toISOString().split("T")[0] // Format as YYYY-MM-DD

    const maintenance = await sql`
      SELECT m.*, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.next_due IS NOT NULL 
      AND m.next_due <= ${futureDateStr}
      ORDER BY m.next_due ASC
    `
    return maintenance
  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error)
    return []
  }
}

export async function getMaintenanceById(id: number): Promise<Maintenance | null> {
  try {
    const maintenance = await sql`
      SELECT m.*, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.maintenance_id = ${id}
    `

    return maintenance.length > 0 ? maintenance[0] : null
  } catch (error) {
    console.error("Error fetching maintenance details:", error)
    return null
  }
}

export async function getMaintenanceLogs(maintenanceId: number): Promise<MaintenanceLog[]> {
  try {
    const logs = await sql`
      SELECT * FROM maintenance_logs
      WHERE maintenance_id = ${maintenanceId}
      ORDER BY performed_date DESC
    `

    return logs
  } catch (error) {
    console.error("Error fetching maintenance logs:", error)
    return []
  }
}

export async function createMaintenance(formData: FormData) {
  // Extract and validate the required fields
  const itemId = Number.parseInt(formData.get("item_id") as string)
  const maintenanceType = formData.get("maintenance_type") as string

  if (!itemId || isNaN(itemId)) {
    console.error("Item ID is required")
    return { success: false, error: "Item ID is required" }
  }

  if (!maintenanceType || maintenanceType.trim() === "") {
    console.error("Maintenance type is required")
    return { success: false, error: "Maintenance type is required" }
  }

  // Extract other fields
  const customMaintenanceType = formData.get("custom_maintenance_type") as string
  const frequencyDays = formData.get("frequency_days") as string
  const lastPerformed = formData.get("last_performed") as string
  const nextDue = formData.get("next_due") as string
  const instructions = formData.get("instructions") as string
  const partsNeeded = formData.get("parts_needed") as string
  const estimatedCost = formData.get("estimated_cost") as string
  const recurrencePattern = formData.get("recurrence_pattern") as string
  const priority = formData.get("priority") as string
  const notificationNotes = formData.get("notification_notes") as string
  const documentationNotes = formData.get("documentation_notes") as string

  // Use custom maintenance type if "Other" is selected
  const finalMaintenanceType =
    maintenanceType === "Other" && customMaintenanceType ? customMaintenanceType : maintenanceType

  try {
    console.log("Creating maintenance task for item:", itemId)

    // Create maintenance record
    const result = await sql`
      INSERT INTO maintenance (
        item_id, maintenance_type, frequency_days, 
        last_performed, next_due, instructions,
        parts_needed, estimated_cost, recurrence_pattern,
        priority, notification_notes, documentation_notes
      ) VALUES (
        ${itemId},
        ${finalMaintenanceType},
        ${frequencyDays ? Number.parseInt(frequencyDays) : null},
        ${lastPerformed || null},
        ${nextDue || null},
        ${instructions || null},
        ${partsNeeded || null},
        ${estimatedCost ? Number.parseFloat(estimatedCost) : null},
        ${recurrencePattern || null},
        ${priority || "medium"},
        ${notificationNotes || null},
        ${documentationNotes || null}
      ) RETURNING maintenance_id
    `

    // Store notification preferences in a separate table (if needed)
    // This would require creating a new table for notification preferences

    revalidatePath("/maintenance")
    return { success: true, id: result[0].maintenance_id }
  } catch (error) {
    console.error("Error creating maintenance task:", error)
    return {
      success: false,
      error: "Failed to create maintenance task: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function createMaintenanceLog(formData: FormData) {
  const maintenanceId = Number.parseInt(formData.get("maintenance_id") as string)
  const performedDate = formData.get("performed_date") as string
  const performedBy = formData.get("performed_by") as string
  const notes = formData.get("notes") as string
  const cost = formData.get("cost") as string

  try {
    // Insert the maintenance log
    await sql`
      INSERT INTO maintenance_logs (
        maintenance_id, performed_date, performed_by, notes, cost
      ) VALUES (
        ${maintenanceId},
        ${performedDate},
        ${performedBy || null},
        ${notes || null},
        ${cost ? Number.parseFloat(cost) : null}
      )
    `

    // Update the maintenance record with the new last_performed date
    // and calculate the next_due date if frequency_days is set
    await sql`
      UPDATE maintenance
      SET last_performed = ${performedDate},
          next_due = CASE 
            WHEN frequency_days IS NOT NULL THEN ${performedDate}::date + (frequency_days * INTERVAL '1 day')
            ELSE next_due
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = ${maintenanceId}
    `

    revalidatePath(`/maintenance/${maintenanceId}`)
    revalidatePath("/maintenance")
    return { success: true }
  } catch (error) {
    console.error("Error creating maintenance log:", error)
    return { success: false, error: "Failed to create maintenance log" }
  }
}
