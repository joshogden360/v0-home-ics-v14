import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn } from "lucide-react"

export default function LoginPage() {

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-3">
            <Link href="/api/auth/login">
              <Button className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in with Auth0
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Secure authentication powered by Auth0
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Click above to sign in securely with your Auth0 account.
              This will redirect you to our secure authentication provider.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            New to our platform?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
