import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

// Enhanced Auth0 route handlers with connection support
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/').filter(Boolean)
  const action = segments[segments.length - 1] // last segment after /api/auth/
  const searchParams = request.nextUrl.searchParams
  const connection = searchParams.get('connection')
  const screenHint = searchParams.get('screen_hint')
  
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-4h71w2jrwhrwt542.us.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID || 'RNYHVZ13K3G23pTmrw8c8gNclcVnyYx1'
  const baseUrl = process.env.AUTH0_BASE_URL || 'http://localhost:3000'
  
  switch (action) {
    case 'login':
      const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`)
      const scope = encodeURIComponent(process.env.AUTH0_SCOPE || 'openid profile email')
      const audience = process.env.AUTH0_AUDIENCE ? `&audience=${encodeURIComponent(process.env.AUTH0_AUDIENCE)}` : ''
      
      let loginUrl = `${auth0Domain}/authorize?` + 
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `state=login${audience}`

      // Add connection parameter for specific providers (google-oauth2, apple, etc.)
      if (connection) {
        loginUrl += `&connection=${connection}`
      }
      
      // Add screen hint for specific flows
      if (screenHint) {
        loginUrl += `&screen_hint=${screenHint}`
      }

      return redirect(loginUrl)
      
    case 'signup':
      const signupRedirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`)
      const signupScope = encodeURIComponent(process.env.AUTH0_SCOPE || 'openid profile email')
      
      let signupUrl = `${auth0Domain}/authorize?` + 
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${signupRedirectUri}&` +
        `scope=${signupScope}&` +
        `state=signup&` +
        `screen_hint=signup`

      // Add connection parameter for specific providers
      if (connection) {
        signupUrl += `&connection=${connection}`
      }

      return redirect(signupUrl)
      
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