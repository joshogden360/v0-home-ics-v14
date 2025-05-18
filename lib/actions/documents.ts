"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import type { Document, DocumentVersion, DocumentFile, DocumentRelation } from "@/lib/types"

// Get all documents with optional filtering
export async function getDocuments({
  category,
  status,
  search,
}: {
  category?: string
  status?: string
  search?: string
} = {}): Promise<Document[]> {
  try {
    let query = `
      SELECT * FROM documents
      WHERE 1=1
    `
    const params: any[] = []

    if (category) {
      query += ` AND category = $${params.length + 1}`
      params.push(category)
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`
      params.push(status)
    }

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY updated_at DESC`

    const documents = await sql(query, params)
    return documents
  } catch (error) {
    console.error("Error fetching documents:", error)
    return []
  }
}

// Get documents by relation type and ID
export async function getDocumentsByRelation(relationType: string, relatedId: number): Promise<Document[]> {
  try {
    const documents = await sql`
      SELECT d.* 
      FROM documents d
      JOIN document_relations r ON d.document_id = r.document_id
      WHERE r.relation_type = ${relationType} AND r.related_id = ${relatedId}
      ORDER BY d.updated_at DESC
    `
    return documents
  } catch (error) {
    console.error(`Error fetching documents for ${relationType} ${relatedId}:`, error)
    return []
  }
}

// Get a single document by ID
export async function getDocumentById(id: number): Promise<Document | null> {
  try {
    const documents = await sql`
      SELECT * FROM documents WHERE document_id = ${id}
    `
    return documents.length > 0 ? documents[0] : null
  } catch (error) {
    console.error("Error fetching document:", error)
    return null
  }
}

// Get document versions
export async function getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
  try {
    const versions = await sql`
      SELECT * FROM document_versions
      WHERE document_id = ${documentId}
      ORDER BY version_number DESC
    `
    return versions
  } catch (error) {
    console.error("Error fetching document versions:", error)
    return []
  }
}

// Get document files
export async function getDocumentFiles(documentId: number): Promise<DocumentFile[]> {
  try {
    const files = await sql`
      SELECT * FROM document_files
      WHERE document_id = ${documentId}
      ORDER BY created_at DESC
    `
    return files
  } catch (error) {
    console.error("Error fetching document files:", error)
    return []
  }
}

// Get document relations with names
export async function getDocumentRelations(documentId: number): Promise<DocumentRelation[]> {
  try {
    const relations = await sql`
      WITH relations AS (
        SELECT * FROM document_relations
        WHERE document_id = ${documentId}
      )
      
      SELECT 
        r.*, 
        CASE 
          WHEN r.relation_type = 'item' THEN i.name
          WHEN r.relation_type = 'room' THEN rm.name
          WHEN r.relation_type = 'maintenance' THEN CONCAT(m.maintenance_type, ' - ', i2.name)
        END as related_name
      FROM relations r
      LEFT JOIN items i ON r.relation_type = 'item' AND r.related_id = i.item_id
      LEFT JOIN rooms rm ON r.relation_type = 'room' AND r.related_id = rm.room_id
      LEFT JOIN maintenance m ON r.relation_type = 'maintenance' AND r.related_id = m.maintenance_id
      LEFT JOIN items i2 ON m.item_id = i2.item_id
      ORDER BY r.relation_type, r.created_at DESC
    `
    return relations
  } catch (error) {
    console.error("Error fetching document relations:", error)
    return []
  }
}

// Create a new document
export async function createDocument(formData: FormData) {
  // Extract basic document fields
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const content = formData.get("content") as string
  const category = formData.get("category") as string
  const status = formData.get("status") as string
  const created_by = formData.get("created_by") as string

  if (!title || title.trim() === "") {
    return { success: false, error: "Document title is required" }
  }

  try {
    // Create the document
    const result = await sql`
      INSERT INTO documents (
        title, description, content, category, status, created_by
      ) VALUES (
        ${title},
        ${description || null},
        ${content || null},
        ${category || null},
        ${status || "draft"},
        ${created_by || null}
      ) RETURNING document_id
    `

    const documentId = result[0].document_id

    // Create initial version if content is provided
    if (content) {
      await sql`
        INSERT INTO document_versions (
          document_id, version_number, content, created_by
        ) VALUES (
          ${documentId},
          1,
          ${content},
          ${created_by || null}
        )
      `
    }

    // Process and upload files
    const filePromises = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        filePromises.push(processFile(documentId, value))
      }
    }

    if (filePromises.length > 0) {
      await Promise.all(filePromises)
    }

    // Process relations
    await processRelations(documentId, formData)

    revalidatePath("/documentation")
    return { success: true, id: documentId }
  } catch (error) {
    console.error("Error creating document:", error)
    return {
      success: false,
      error: "Failed to create document: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

// Create a new document version
export async function createDocumentVersion(formData: FormData) {
  const documentId = Number.parseInt(formData.get("document_id") as string)
  const versionNumber = Number.parseInt(formData.get("version_number") as string)
  const content = formData.get("content") as string
  const changeNotes = formData.get("change_notes") as string
  const createdBy = formData.get("created_by") as string

  if (!documentId || isNaN(documentId)) {
    return { success: false, error: "Document ID is required" }
  }

  if (!versionNumber || isNaN(versionNumber)) {
    return { success: false, error: "Version number is required" }
  }

  try {
    // Create the new version
    const result = await sql`
      INSERT INTO document_versions (
        document_id, version_number, content, change_notes, created_by
      ) VALUES (
        ${documentId},
        ${versionNumber},
        ${content || null},
        ${changeNotes || null},
        ${createdBy || null}
      ) RETURNING version_id
    `

    const versionId = result[0].version_id

    // Update the document content and updated_at timestamp
    await sql`
      UPDATE documents
      SET content = ${content || null}, updated_at = CURRENT_TIMESTAMP
      WHERE document_id = ${documentId}
    `

    revalidatePath(`/documentation/${documentId}`)
    return { success: true, id: versionId }
  } catch (error) {
    console.error("Error creating document version:", error)
    return {
      success: false,
      error: "Failed to create document version: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

// Delete a document
export async function deleteDocument(id: number) {
  try {
    // The database cascade will handle deleting related records
    await sql`DELETE FROM documents WHERE document_id = ${id}`
    revalidatePath("/documentation")
    return { success: true }
  } catch (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: "Failed to delete document" }
  }
}

// Helper function to process and upload a file
async function processFile(documentId: number, file: File) {
  try {
    // Create a unique filename
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`.toLowerCase()
    const folderPath = `document-${documentId}`

    // Upload file to Vercel Blob
    const blob = await put(`${folderPath}/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000, // 1 year in seconds
    })

    // Save the file information to the database
    await sql`
      INSERT INTO document_files (
        document_id, file_path, file_name, file_size, mime_type
      ) VALUES (
        ${documentId},
        ${blob.url},
        ${file.name},
        ${file.size},
        ${file.type}
      )
    `

    return blob.url
  } catch (error) {
    console.error("Error processing file:", error)
    throw error
  }
}

// Helper function to process relations
async function processRelations(documentId: number, formData: FormData) {
  // Process item relations
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("item_")) {
      const itemId = Number.parseInt(value as string)
      if (!isNaN(itemId)) {
        await sql`
          INSERT INTO document_relations (document_id, relation_type, related_id)
          VALUES (${documentId}, 'item', ${itemId})
        `
      }
    }
  }

  // Process room relations
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("room_")) {
      const roomId = Number.parseInt(value as string)
      if (!isNaN(roomId)) {
        await sql`
          INSERT INTO document_relations (document_id, relation_type, related_id)
          VALUES (${documentId}, 'room', ${roomId})
        `
      }
    }
  }

  // Process maintenance relations
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("maintenance_")) {
      const maintenanceId = Number.parseInt(value as string)
      if (!isNaN(maintenanceId)) {
        await sql`
          INSERT INTO document_relations (document_id, relation_type, related_id)
          VALUES (${documentId}, 'maintenance', ${maintenanceId})
        `
      }
    }
  }
}
