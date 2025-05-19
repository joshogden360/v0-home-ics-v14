export const metadata = {
  title: "Sign Up",
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const oauthUrl = process.env.NEXT_PUBLIC_VERCEL_OAUTH_URL || "/api/auth/login";
  return (
    <div className="container py-10 space-y-8 max-w-md">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sign Up</h1>
        <p className="text-muted-foreground">Create an account using a method below.</p>
      </div>
      <div className="space-y-4">
        <Button className="w-full" variant="outline">
          Sign up with Google
        </Button>
        <Button className="w-full" variant="outline">
          Sign up with Apple
        </Button>
        <form className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
          <Button className="w-full">Sign up with Email</Button>
        </form>
        <form className="space-y-2">
          <Label htmlFor="phone">Cell Phone</Label>
          <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
          <Button className="w-full">Send Signup Code</Button>
        </form>
        <Link href={oauthUrl}>
          <Button className="w-full">Continue with Vercel</Button>
        </Link>
      </div>
    </div>
  )
}
