import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function middleware(request: NextRequest) {
  // Temporarily bypass all middleware for Auth0 testing
  return NextResponse.next()
  
  // Development bypass - remove this in production
  if (process.env.NODE_ENV === 'development') {
    // Allow access to all pages in development
    return NextResponse.next()
  }
  
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")

  if (!sessionToken && !isAuthPage) {
    // Redirect to login if not authenticated and not on an auth page
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (sessionToken && isAuthPage) {
    // Redirect to dashboard if authenticated and on an auth page
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 