import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    // Return user data without sensitive information
    return NextResponse.json({
      user: {
        id: session.userId,
        auth0Id: session.auth0Id,
        email: session.email,
        name: session.name,
        picture: session.picture
      },
      authenticated: true
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ user: null, authenticated: false })
  }
} 