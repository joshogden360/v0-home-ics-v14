import { neon } from "@neondatabase/serverless"

// Create a SQL client with the Neon database URL
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute raw SQL queries with better error handling
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Use sql.query for parameterized queries
    if (params && params.length > 0) {
      const result = await sql.query(query, params)
      return result.rows || []
    } else {
      // Use tagged template for simple queries
      // We need to convert the string to a template literal execution
      const result = await sql(query)
      return result || []
    }
  } catch (error) {
    console.error("Database query error:", error)
    // Return an empty array instead of throwing to prevent rendering errors
    return []
  }
}
