import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const key = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.AUTH0_SECRET || 'fallback-secret-key-please-change-in-production'
)

export interface SessionPayload {
  userId: number
  auth0Id: string
  email: string
  name: string
  picture?: string
  expiresAt: number
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const session = await new SignJWT({ ...payload, expiresAt: expiresAt.getTime() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key)

  const cookieStore = await cookies()
  cookieStore.set('session_token', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return session
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key)
    
    // Check if session is expired
    const expiresAt = payload.expiresAt as number
    if (!expiresAt || Date.now() > expiresAt) {
      return null
    }

    return {
      userId: payload.userId as number,
      auth0Id: payload.auth0Id as string,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string | undefined,
      expiresAt: expiresAt
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session_token')
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  
  if (!token) {
    return
  }

  const session = await verifySession(token)
  
  if (!session) {
    return
  }

  // Refresh the session if it's valid
  const response = NextResponse.next()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  
  const newSession = await new SignJWT({ ...session, expiresAt: expiresAt.getTime() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key)

  response.cookies.set('session_token', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return response
} 