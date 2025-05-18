import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="hidden sm:inline-block">Apartment Inventory</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <Link href="/signup">
            <Button variant="outline" size="sm">
              Sign Up
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Login</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
