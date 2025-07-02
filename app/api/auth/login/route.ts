import { redirect } from "next/navigation"

export async function GET() {
  // Construct Auth0 login URL
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || 'dev-4h7fw2jrvhrwt542.us.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID || 'RNYHVZ13K3G23pTmrw8c8gNclcVnyYx1'
  const redirectUri = encodeURIComponent(`${process.env.AUTH0_BASE_URL || 'http://localhost:3000'}/api/auth/callback`)
  const scope = encodeURIComponent('openid profile email')
  
  const loginUrl = `https://${auth0Domain}/authorize?` + 
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `state=login`

  return redirect(loginUrl)
}
