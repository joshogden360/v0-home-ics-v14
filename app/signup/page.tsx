import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { UserPlus } from "lucide-react"

export default function SignupPage() {

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Sign up to start managing your inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Link href="/api/auth/signup">
              <Button className="w-full" size="lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Sign up with Auth0
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Secure registration powered by Auth0
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Click above to create your account securely with Auth0.
              Your account will be automatically created when you sign in for the first time.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
