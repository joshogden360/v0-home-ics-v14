import { redirect } from "next/navigation"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_VERCEL_OAUTH_URL
  if (url) {
    return redirect(url)
  }
  return redirect("https://vercel.com")
}
