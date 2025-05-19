export const metadata = {
  title: "Login",
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const oauthUrl = process.env.NEXT_PUBLIC_VERCEL_OAUTH_URL || "/api/auth/login"

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center justify-center space-y-8 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Login</h1>
        <p className="text-muted-foreground">Authenticate with your Vercel account.</p>
      </div>
      <Link href={oauthUrl} className="w-full">
        <Button className="w-full">Login with Vercel</Button>
      </Link>
    </div>
  )
}
