"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, DoorOpen, Wrench, Tag, Settings, FileText } from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Items",
    href: "/items",
    icon: Package,
  },
  {
    label: "Rooms",
    href: "/rooms",
    icon: DoorOpen,
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Documentation",
    href: "/documentation",
    icon: FileText,
  },
  {
    label: "Tags",
    href: "/tags",
    icon: Tag,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
            pathname === route.href || pathname.startsWith(`${route.href}/`)
              ? "bg-muted text-primary"
              : "text-muted-foreground",
          )}
        >
          <route.icon className="h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
