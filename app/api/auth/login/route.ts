import { redirect } from "next/navigation"
import { NextRequest } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcrypt"
import { createSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const connection = searchParams.get('connection')
  const screenHint = searchParams.get('screen_hint')
  
  // Construct Auth0 login URL
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'dev-4h71w2jrwhrwt542.us.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID || 'RNYHVZ13K3G23pTmrw8c8gNclcVnyYx1'
  const redirectUri = encodeURIComponent(`${process.env.AUTH0_BASE_URL || 'http://localhost:3000'}/api/auth/callback`)
  const scope = encodeURIComponent('openid profile email')
  
  let loginUrl = `https://${auth0Domain}/authorize?` + 
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `state=login`

  // Add connection parameter for specific providers
  if (connection) {
    loginUrl += `&connection=${connection}`
  }
  
  // Add screen hint for specific flows (like forgot password)
  if (screenHint) {
    loginUrl += `&screen_hint=${screenHint}`
  }

  return redirect(loginUrl)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return redirect('/login?error=missing_credentials')
    }

    // Check if user exists in database
    const users = await sql`
      SELECT user_id, email, password_hash, full_name, avatar_url 
      FROM users 
      WHERE email = ${email}
    `
    
    if (users.length === 0) {
      return redirect('/login?error=invalid_credentials')
    }

    const user = users[0]
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return redirect('/login?error=invalid_credentials')
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = NOW(), updated_at = NOW()
      WHERE user_id = ${user.user_id}
    `

    // Create session for the authenticated user
    await createSession({
      userId: user.user_id,
      auth0Id: `email|${user.user_id}`, // Create pseudo auth0 ID for email users
      email: user.email,
      name: user.full_name || 'Unknown User',
      picture: user.avatar_url
    })

    console.log('✅ Session created for email login:', user.email)
    return redirect('/?login=success&method=email')

  } catch (error) {
    console.error('Login error:', error)
    return redirect('/login?error=login_failed')
  }
}
