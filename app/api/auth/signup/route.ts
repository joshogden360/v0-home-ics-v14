import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcrypt"
import { redirect } from "next/navigation"
import { createSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password || !fullName) {
      return redirect('/signup?error=missing_fields')
    }

    if (password !== confirmPassword) {
      return redirect('/signup?error=password_mismatch')
    }

    if (password.length < 8) {
      return redirect('/signup?error=password_too_short')
    }

    // Check if the user already exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    if (existingUsers.length > 0) {
      return redirect('/signup?error=email_exists')
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12)

    // Insert the new user into the database
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, created_at, updated_at)
      VALUES (${email}, ${passwordHash}, ${fullName}, NOW(), NOW())
      RETURNING user_id, email, full_name, created_at
    `

    const newUser = result[0]
    const auth0Id = `email|${newUser.user_id}`

    // Update the user with the auth0_id for RLS compatibility
    await sql`
      UPDATE users 
      SET auth0_id = ${auth0Id}
      WHERE user_id = ${newUser.user_id}
    `

    console.log('✅ New user created:', newUser.email)

    // Create session for the new user (auto-login after signup)
    await createSession({
      userId: newUser.user_id,
      auth0Id: auth0Id, // Create pseudo auth0 ID for email users
      email: newUser.email,
      name: newUser.full_name,
      picture: undefined
    })

    console.log('✅ Session created for new user:', newUser.email)
    return redirect('/?signup=success&message=welcome')

  } catch (error) {
    console.error("Signup error:", error)
    return redirect('/signup?error=signup_failed')
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const connection = searchParams.get('connection')
  
  // Construct Auth0 signup URL (with screen_hint=signup)
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'dev-4h71w2jrwhrwt542.us.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID || 'RNYHVZ13K3G23pTmrw8c8gNclcVnyYx1'
  const baseUrl = (process.env.AUTH0_BASE_URL || 'http://localhost:3000').replace(/\/$/, '') // Remove trailing slash
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`)
  const scope = encodeURIComponent('openid profile email')
  
  let signupUrl = `https://${auth0Domain}/authorize?` + 
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `state=signup&` +
    `screen_hint=signup`
  
  // Add connection parameter for specific providers
  if (connection) {
    signupUrl += `&connection=${connection}`
  }

  return redirect(signupUrl)
} 