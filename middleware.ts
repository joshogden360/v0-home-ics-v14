import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes (except /api/auth routes that need protection)
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Skip middleware for static files
  if (request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get("session_token")?.value
  const session = sessionToken ? await verifySession(sessionToken) : null

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")

  // Protected routes that require authentication
  const isProtectedRoute = 
    request.nextUrl.pathname === "/" ||
    (request.nextUrl.pathname.startsWith("/items") && 
     request.nextUrl.pathname !== "/items/create" && 
     request.nextUrl.pathname !== "/items/create-test") ||
    request.nextUrl.pathname.startsWith("/rooms") ||
    request.nextUrl.pathname.startsWith("/maintenance") ||
    request.nextUrl.pathname.startsWith("/documentation") ||
    request.nextUrl.pathname.startsWith("/tags") ||
    request.nextUrl.pathname.startsWith("/settings")

  // If user is not authenticated and trying to access protected route
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session && isAuthPage) {
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