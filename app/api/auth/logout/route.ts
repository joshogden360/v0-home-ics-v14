import { redirect } from "next/navigation"

export async function GET() {
  // Construct Auth0 logout URL
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-4h7fw2jrvhrwt542.us.auth0.com'
  const returnTo = encodeURIComponent(`${process.env.AUTH0_BASE_URL || 'http://localhost:3000'}/login`)
  
  const logoutUrl = `${auth0Domain}/v2/logout?returnTo=${returnTo}`

  return redirect(logoutUrl)
} 