import { sql } from './db'

/**
 * Set the current user context for Row Level Security
 * This function should be called before any database operations
 * that require user-specific data access
 */
export async function setUserContext(auth0UserId: string) {
  try {
    await sql`SELECT set_config('app.current_user_auth0_id', ${auth0UserId}, true)`
  } catch (error) {
    console.error('Failed to set user context:', error)
    throw new Error('Failed to set user context for database operations')
  }
}

/**
 * Clear the current user context
 * This should be called at the end of request processing
 */
export async function clearUserContext() {
  try {
    await sql`SELECT set_config('app.current_user_auth0_id', '', true)`
  } catch (error) {
    console.error('Failed to clear user context:', error)
  }
}

/**
 * Execute a database operation with user context
 * This is a wrapper that automatically sets and clears the user context
 */
export async function withUserContext<T>(
  auth0UserId: string,
  operation: () => Promise<T>
): Promise<T> {
  await setUserContext(auth0UserId)
  
  try {
    const result = await operation()
    return result
  } finally {
    await clearUserContext()
  }
}

/**
 * Create or update a user record based on Auth0 data
 * This should be called during the Auth0 callback process
 */
export async function upsertUserFromAuth0(auth0User: {
  sub: string // Auth0 user ID
  email: string
  name?: string
  picture?: string
}) {
  try {
    const result = await sql`
      INSERT INTO users (auth0_id, email, full_name, avatar_url, last_login)
      VALUES (${auth0User.sub}, ${auth0User.email}, ${auth0User.name || null}, ${auth0User.picture || null}, NOW())
      ON CONFLICT (auth0_id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        last_login = NOW(),
        updated_at = NOW()
      RETURNING user_id, auth0_id, email, full_name, avatar_url
    `
    
    return result[0]
  } catch (error) {
    console.error('Failed to upsert user from Auth0:', error)
    throw new Error('Failed to create or update user record')
  }
}

/**
 * Get user by Auth0 ID
 */
export async function getUserByAuth0Id(auth0UserId: string) {
  try {
    const result = await sql`
      SELECT user_id, auth0_id, email, full_name, avatar_url, created_at, updated_at
      FROM users 
      WHERE auth0_id = ${auth0UserId}
    `
    
    return result[0] || null
  } catch (error) {
    console.error('Failed to get user by Auth0 ID:', error)
    return null
  }
}

/**
 * Middleware helper to extract Auth0 user ID from request
 * This should be adapted based on your Auth0 implementation
 */
export function extractAuth0UserId(request: Request): string | null {
  // This is a placeholder - you'll need to implement based on your Auth0 setup
  // Typically this would involve:
  // 1. Extracting JWT token from Authorization header
  // 2. Verifying the token with Auth0
  // 3. Extracting the 'sub' claim (Auth0 user ID)
  
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  // You would decode and verify the JWT here
  // For now, this is a placeholder
  return null
}

/**
 * Database-level user context type for TypeScript
 */
export interface DatabaseUserContext {
  userId: number
  auth0Id: string
  email: string
  fullName?: string
  avatarUrl?: string
} 