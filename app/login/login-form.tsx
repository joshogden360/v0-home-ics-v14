"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2 } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      })

      // The login route returns redirects, so we need to handle the response differently
      if (response.redirected) {
        window.location.href = response.url
      } else if (response.status === 200) {
        // If successful, redirect to dashboard
        window.location.href = '/'
      } else {
        // If there's an error, the server will redirect to login with error params
        // We can check the response URL for error parameters
        window.location.href = response.url || '/login?error=login_failed'
      }
    } catch (error) {
      console.error('Login error:', error)
      window.location.href = '/login?error=login_failed'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="remember" className="rounded" disabled={isLoading} />
          <span className="text-muted-foreground">Remember me</span>
        </label>
        <Link href="/api/auth/login?screen_hint=forgot_password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Sign in with Email
          </>
        )}
      </Button>
    </form>
  )
} 