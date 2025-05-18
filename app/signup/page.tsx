export const metadata = {
  title: "Sign Up",
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const oauthUrl = process.env.NEXT_PUBLIC_VERCEL_OAUTH_URL || "/api/auth/login";
  return (
    <div className="container py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sign Up</h1>
        <p className="text-muted-foreground">Create an account using your Vercel login.</p>
      </div>
      <div className="flex justify-center">
        <Link href={oauthUrl}>
          <Button>Continue with Vercel</Button>
        </Link>
      </div>
    </div>
  )
}
