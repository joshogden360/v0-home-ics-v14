"use client"

import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { LogOut, User } from "lucide-react"

interface User {
  id: number
  email: string
  name: string
  picture?: string
}

interface SessionData {
  user: User | null
  authenticated: boolean
}

export function Header() {
  const [session, setSession] = useState<SessionData>({ user: null, authenticated: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then((data: SessionData) => {
        setSession(data)
        setLoading(false)
      })
      .catch(() => {
        setSession({ user: null, authenticated: false })
        setLoading(false)
      })
  }, [])

  const handleLogout = () => {
    // Navigate to logout endpoint
    window.location.href = '/api/auth/logout'
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="hidden sm:inline-block">Apartment Inventory</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          
          {loading ? (
            // Loading state
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : session.authenticated && session.user ? (
            // Authenticated user
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block">{session.user.name}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            // Unauthenticated user
            <div className="flex items-center space-x-2">
              <Link href="/signup">
                <Button variant="outline" size="sm">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
