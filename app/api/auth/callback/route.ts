import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided." },
      { status: 400 }
    )
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(
      "https://api.vercel.com/v2/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
          client_secret: process.env.STACK_SECRET_SERVER_KEY!,
          code: code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json(
        { error: "Failed to fetch access token.", details: tokenData.error_description },
        { status: 400 }
      )
    }

    const accessToken = tokenData.access_token

    // Use the access token to fetch user information
    const userResponse = await fetch("https://api.vercel.com/v2/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user data.", details: userData.error },
        { status: 400 }
      )
    }

    // Set the user session in cookies
    const cookieStore = await cookies()
    await cookieStore.set("session_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Redirect the user to the dashboard
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    )
  }
} 