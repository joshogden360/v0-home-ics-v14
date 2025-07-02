import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle Auth0 errors
  if (error) {
    console.error('Auth0 error:', error)
    return redirect('/login?error=auth_failed')
  }

  // Check for authorization code
  if (!code) {
    console.error('No authorization code received')
    return redirect('/login?error=no_code')
  }

  try {
    // Exchange authorization code for tokens
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-4h7fw2jrvhrwt542.us.auth0.com'
    const clientId = process.env.AUTH0_CLIENT_ID!
    const clientSecret = process.env.AUTH0_CLIENT_SECRET!
    const redirectUri = `${process.env.AUTH0_BASE_URL || 'http://localhost:3000'}/api/auth/callback`

    const tokenResponse = await fetch(`${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens)
      return redirect('/login?error=token_exchange_failed')
    }

    // Get user info
    const userResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userResponse.json()

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userInfo)
      return redirect('/login?error=user_info_failed')
    }

    // Create or update user in database
    try {
      await sql`
        INSERT INTO users (auth0_id, email, full_name, avatar_url, last_login)
        VALUES (${userInfo.sub}, ${userInfo.email}, ${userInfo.name || null}, ${userInfo.picture || null}, NOW())
        ON CONFLICT (auth0_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          avatar_url = EXCLUDED.avatar_url,
          last_login = NOW(),
          updated_at = NOW()
      `
      
      console.log('✅ User synced with database:', userInfo.email)
    } catch (dbError) {
      console.error('❌ Failed to sync user with database:', dbError)
      // Don't fail the login process, just log the error
    }

    // For now, redirect to dashboard with success
    // In a real app, you'd set proper session cookies here
    return redirect('/?login=success')

  } catch (error) {
    // Check if this is a Next.js redirect (which is expected)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw redirect errors
    }
    
    console.error('Auth0 callback error:', error)
    return redirect('/login?error=callback_failed')
  }
} 