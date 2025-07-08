import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { LoginForm } from "./login-form"

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    message?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'missing_credentials':
        return 'Please enter both email and password.'
      case 'invalid_credentials':
        return 'Invalid email or password. Please try again.'
      case 'login_failed':
        return 'Login failed. Please try again later.'
      case 'auth_failed':
        return 'Authentication failed. Please try again.'
      case 'no_code':
        return 'No authorization code received from Auth0.'
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code for tokens.'
      case 'user_info_failed':
        return 'Failed to retrieve user information.'
      case 'callback_failed':
        return 'Authentication callback failed.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  const getSuccessMessage = (message: string) => {
    switch (message) {
      case 'account_created':
        return 'Account created successfully! Please sign in.'
      case 'logged_out':
        return 'You have been logged out successfully.'
      default:
        return message
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{getSuccessMessage(message)}</AlertDescription>
            </Alert>
          )}

          {/* Social Authentication */}
          <div className="space-y-3">
            <Link href="/api/auth/login">
              <Button className="w-full" size="lg" variant="outline">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </Link>
            
            <Link href="/api/auth/login?connection=apple">
              <Button className="w-full" size="lg" variant="outline">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <LoginForm />
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            New user?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
