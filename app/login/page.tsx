"use client"

import { useRouter } from "next/navigation"
import { useAtom, useSetAtom } from "jotai"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginFormAtom, userAtom, sessionTokenAtom } from "@/lib/atoms/auth"
import { showNotificationAtom } from "@/lib/atoms/atoms"

export default function LoginPage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useAtom(loginFormAtom)
  const setUser = useSetAtom(userAtom)
  const setSessionToken = useSetAtom(sessionTokenAtom)
  const showNotification = useSetAtom(showNotificationAtom)
  
  const oauthUrl = process.env.NEXT_PUBLIC_VERCEL_OAUTH_URL || "/api/auth/login"

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginForm(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // TODO: Implement actual authentication
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful login
      const mockUser = {
        id: '1',
        email: loginForm.email,
        name: 'Demo User'
      }
      
      setUser(mockUser)
      setSessionToken('mock-session-token')
      
      showNotification({
        title: "Success",
        message: "Successfully logged in!",
        type: "success"
      })
      
      router.push('/')
    } catch (error) {
      setLoginForm(prev => ({ 
        ...prev, 
        error: "Invalid email or password",
        isSubmitting: false 
      }))
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginForm(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // TODO: Implement phone authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showNotification({
        title: "Code Sent",
        message: "A login code has been sent to your phone",
        type: "info"
      })
      
      setLoginForm(prev => ({ ...prev, isSubmitting: false }))
    } catch (error) {
      setLoginForm(prev => ({ 
        ...prev, 
        error: "Failed to send login code",
        isSubmitting: false 
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginForm.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginForm.error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={handleInputChange}
                    required
                    disabled={loginForm.isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={handleInputChange}
                    required
                    disabled={loginForm.isSubmitting}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginForm.isSubmitting}
                >
                  {loginForm.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in with Email"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="phone">
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={loginForm.phone}
                    onChange={handleInputChange}
                    required
                    disabled={loginForm.isSubmitting}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginForm.isSubmitting}
                >
                  {loginForm.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Send Login Code"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" className="w-full" disabled={loginForm.isSubmitting}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
            
            <Button variant="outline" className="w-full" disabled={loginForm.isSubmitting}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                  fill="currentColor"
                />
              </svg>
              Sign in with Apple
            </Button>
            
            <Link href={oauthUrl}>
              <Button variant="outline" className="w-full" disabled={loginForm.isSubmitting}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M24 12l-11-8v6H1v4h12v6z"
                  />
                </svg>
                Sign in with Vercel
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-muted-foreground w-full">
            Don't have an account?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
