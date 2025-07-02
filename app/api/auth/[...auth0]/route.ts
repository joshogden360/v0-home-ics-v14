import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

// Simple Auth0 route handlers since the SDK imports are having issues
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/').filter(Boolean)
  const action = segments[segments.length - 1] // last segment after /api/auth/
  
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-4h71w2jrwhrwt542.us.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID || 'RNYHVZI3K3G23pTmrw8c8gNcIcVnyYxi'
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3001'
  
  switch (action) {
    case 'login':
      const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`)
      const scope = encodeURIComponent(process.env.AUTH0_SCOPE || 'openid profile email')
      const audience = process.env.AUTH0_AUDIENCE ? `&audience=${encodeURIComponent(process.env.AUTH0_AUDIENCE)}` : ''
      
      const loginUrl = `${auth0Domain}/authorize?` + 
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `state=login${audience}`

      return redirect(loginUrl)
      
    case 'logout':
      const returnTo = encodeURIComponent(`${baseUrl}/login`)
      const logoutUrl = `${auth0Domain}/v2/logout?returnTo=${returnTo}`
      return redirect(logoutUrl)
      
    case 'callback':
      // Handle the callback (this will be handled by our existing callback route)
      return redirect('/api/auth/callback?' + request.nextUrl.searchParams.toString())
      
    default:
      return new Response('Not Found', { status: 404 })
  }
} 