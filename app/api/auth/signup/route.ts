import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    // Check if the user already exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      )
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert the new user into the database
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name)
      VALUES (${email}, ${passwordHash}, ${fullName || null})
      RETURNING user_id, email, full_name, created_at
    `

    const newUser = result[0]

    return NextResponse.json(
      { message: "User created successfully.", user: newUser },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred during signup." },
      { status: 500 }
    )
  }
} 