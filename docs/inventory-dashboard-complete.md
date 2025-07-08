# Inventory Dashboard - Complete Code Reference

## Project Architecture

```
inventory-dashboard/
├── ROOT LAYOUT & CONFIGURATION
│   ├── app/layout.tsx                    - Root layout, theme provider
│   ├── app/globals.css                   - Global styles, CSS variables
│   ├── middleware.ts                     - Next.js middleware
│   ├── package.json                      - Dependencies & scripts
│   ├── tsconfig.json                     - TypeScript configuration
│   └── next.config.mjs                   - Next.js configuration
│
├── CORE APPLICATION PAGES
│   ├── app/page.tsx                      - Dashboard homepage
│   └── app/main-nav.tsx                  - Main navigation component
│
├── UI COMPONENTS LIBRARY
│   ├── components/ui/button.tsx          - Base button component
│   ├── components/ui/input.tsx           - Input form component
│   ├── components/ui/card.tsx            - Card container component
│   ├── components/ui/form.tsx            - Form handling components
│   └── components/ui/table.tsx           - Data table components
│
├── BUSINESS LOGIC & ACTIONS
│   ├── lib/actions/items.ts              - Item CRUD operations
│   ├── lib/actions/rooms.ts              - Room CRUD operations
│   └── lib/actions/dashboard.ts          - Dashboard data fetching
│
├── STATE MANAGEMENT (JOTAI)
│   ├── lib/atoms/atoms.ts                - Main UI & data atoms
│   └── lib/atoms/ai.ts                   - AI-specific state atoms
│
└── CORE UTILITIES
    ├── lib/types.ts                      - TypeScript type definitions
    ├── lib/utils.ts                      - Utility functions
    └── lib/db.ts                         - Database connection
```

## Table of Contents

1. [Project Foundation](#project-foundation)
2. [Configuration Files](#configuration-files)
3. [Core Application Pages](#core-application-pages)
4. [UI Component Library](#ui-component-library)
5. [Business Logic & Server Actions](#business-logic--server-actions)
6. [State Management (Jotai)](#state-management-jotai)
7. [Core Utilities & Types](#core-utilities--types)
8. [Quick Reference Guide](#quick-reference-guide)

---

## Project Foundation

### app/layout.tsx
```typescript
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { MainNav } from "@/components/main-nav"
import { JotaiProvider } from "@/components/providers/jotai-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Apartment Inventory",
  description: "Manage your apartment inventory with ease",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <JotaiProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <div className="hidden w-64 flex-col border-r md:flex p-4">
                  <MainNav />
                </div>
                <main className="flex-1 p-6">{children}</main>
              </div>
            </div>
          </ThemeProvider>
        </JotaiProvider>
      </body>
    </html>
  )
}
```

### app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

* {
  border-color: hsl(var(--border));
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
}
```

### middleware.ts
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  }

  // Handle authentication for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/items') ||
                          request.nextUrl.pathname.startsWith('/rooms') ||
                          request.nextUrl.pathname.startsWith('/maintenance') ||
                          request.nextUrl.pathname.startsWith('/documentation') ||
                          request.nextUrl.pathname.startsWith('/tags') ||
                          request.nextUrl.pathname.startsWith('/settings')

  if (isProtectedRoute) {
    // For now, allow all requests - implement authentication logic here
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Configuration Files

### package.json
```json
{
  "name": "my-v0-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "PORT=3000 next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "node -r dotenv/config ./db/scripts/migrate.js",
    "db:migrate-sql": "node -r dotenv/config ./db/scripts/migrate-sql.js"
  },
  "dependencies": {
    "@auth0/nextjs-auth0": "^4.7.0",
    "@codemirror/lang-markdown": "latest",
    "@codemirror/state": "latest",
    "@codemirror/theme-one-dark": "latest",
    "@google/generative-ai": "^0.24.1",
    "@hookform/resolvers": "latest",
    "@neondatabase/serverless": "^1.0.1",
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-aspect-ratio": "1.1.1",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-context-menu": "2.2.4",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-hover-card": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-menubar": "1.1.4",
    "@radix-ui/react-navigation-menu": "1.2.3",
    "@radix-ui/react-popover": "latest",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "latest",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "latest",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "@tanstack/react-table": "latest",
    "@types/bcrypt": "^5.0.2",
    "@vercel/blob": "latest",
    "jotai": "^2.12.5",
    "lucide-react": "^0.454.0",
    "next": "15.2.4",
    "next-themes": "latest",
    "react": "^19",
    "react-dom": "^19",
    "react-hook-form": "latest",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@typescript-eslint/eslint-plugin": "^8.35.0",
    "@typescript-eslint/parser": "^8.35.0",
    "eslint": "^9.30.0",
    "eslint-config-next": "^15.3.4",
    "postcss": "^8",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    }
  }
}

export default nextConfig
```

---

## Core Application Pages

### app/page.tsx
```typescript
import { getDashboardStats } from "@/lib/actions/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DoorOpen, Image, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export default async function Dashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your apartment inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.items}</div>
            <p className="text-xs text-muted-foreground">Items in your inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.rooms}</div>
            <p className="text-xs text-muted-foreground">Rooms in your apartment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.counts.media}</div>
            <p className="text-xs text-muted-foreground">Images and documents</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Maintenance tasks due in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingMaintenance && stats.upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingMaintenance.map((task) => (
                  <div key={task.maintenance_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{task.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.maintenance_type} - Due {formatDate(task.next_due!)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/maintenance">
                  <Button variant="outline" className="w-full">
                    View All Maintenance
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No upcoming maintenance tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Items added in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentItems && stats.recentItems.length > 0 ? (
              <div className="space-y-4">
                {stats.recentItems.map((item) => (
                  <div key={item.item_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/items">
                  <Button variant="outline" className="w-full">
                    View All Items
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent items</p>
                <Link href="/items/new">
                  <Button className="mt-4">Add Your First Item</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### app/main-nav.tsx
```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, DoorOpen, Wrench, Tag, Settings, FileText, Brain } from "lucide-react"

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
    label: "AI Analysis",
    href: "/items/ai-analysis",
    icon: Brain,
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
```

---

## UI Component Library

### components/ui/button.tsx
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### components/ui/input.tsx
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### components/ui/card.tsx
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### components/ui/form.tsx
```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

### components/ui/table.tsx
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---

## Business Logic & Server Actions

### lib/actions/items.ts
```typescript
"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import type { Item } from "@/lib/types"

export async function createItem(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const purchaseDate = formData.get("purchaseDate") as string
  const purchasePrice = formData.get("purchasePrice") as string
  const condition = formData.get("condition") as string
  const notes = formData.get("notes") as string

  try {
    const result = await sql`
      INSERT INTO items (name, description, category, purchase_date, purchase_price, condition, notes)
      VALUES (${name}, ${description}, ${category}, ${purchaseDate || null}, ${purchasePrice || null}, ${condition}, ${notes})
      RETURNING item_id
    `
    
    const itemId = result[0].item_id
    revalidatePath('/items')
    redirect(`/items/${itemId}`)
  } catch (error) {
    console.error('Error creating item:', error)
    throw new Error('Failed to create item')
  }
}

export async function getItems() {
  try {
    const items = await sql`
      SELECT i.*, r.name as room_name, r.room_id
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
      ORDER BY i.created_at DESC
    `
    return items as Item[]
  } catch (error) {
    console.error('Error fetching items:', error)
    return []
  }
}

export async function getItemById(id: number) {
  try {
    const items = await sql`
      SELECT i.*, r.name as room_name, r.room_id
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
      WHERE i.item_id = ${id}
    `
    return items[0] as Item | null
  } catch (error) {
    console.error('Error fetching item:', error)
    return null
  }
}

export async function updateItem(id: number, formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const purchaseDate = formData.get("purchaseDate") as string
  const purchasePrice = formData.get("purchasePrice") as string
  const condition = formData.get("condition") as string
  const notes = formData.get("notes") as string

  try {
    await sql`
      UPDATE items
      SET name = ${name}, description = ${description}, category = ${category},
          purchase_date = ${purchaseDate || null}, purchase_price = ${purchasePrice || null},
          condition = ${condition}, notes = ${notes}, updated_at = CURRENT_TIMESTAMP
      WHERE item_id = ${id}
    `
    
    revalidatePath('/items')
    revalidatePath(`/items/${id}`)
    redirect(`/items/${id}`)
  } catch (error) {
    console.error('Error updating item:', error)
    throw new Error('Failed to update item')
  }
}

export async function deleteItem(id: number) {
  try {
    await sql`DELETE FROM items WHERE item_id = ${id}`
    revalidatePath('/items')
    redirect('/items')
  } catch (error) {
    console.error('Error deleting item:', error)
    throw new Error('Failed to delete item')
  }
}

export async function searchItems(query: string) {
  try {
    const items = await sql`
      SELECT i.*, r.name as room_name, r.room_id
      FROM items i
      LEFT JOIN locations l ON i.item_id = l.item_id
      LEFT JOIN rooms r ON l.room_id = r.room_id
      WHERE i.name ILIKE ${'%' + query + '%'} 
         OR i.description ILIKE ${'%' + query + '%'}
         OR i.category ILIKE ${'%' + query + '%'}
      ORDER BY i.created_at DESC
    `
    return items as Item[]
  } catch (error) {
    console.error('Error searching items:', error)
    return []
  }
}
```

### lib/actions/rooms.ts
```typescript
"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Room } from "@/lib/types"

export async function createRoom(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const floorNumber = formData.get("floorNumber") as string
  const areaSqft = formData.get("areaSqft") as string

  try {
    const result = await sql`
      INSERT INTO rooms (name, description, floor_number, area_sqft)
      VALUES (${name}, ${description}, ${parseInt(floorNumber)}, ${areaSqft ? parseFloat(areaSqft) : null})
      RETURNING room_id
    `
    
    const roomId = result[0].room_id
    revalidatePath('/rooms')
    redirect(`/rooms/${roomId}`)
  } catch (error) {
    console.error('Error creating room:', error)
    throw new Error('Failed to create room')
  }
}

export async function getRooms() {
  try {
    const rooms = await sql`
      SELECT r.*, 
             COUNT(l.item_id) as item_count
      FROM rooms r
      LEFT JOIN locations l ON r.room_id = l.room_id
      GROUP BY r.room_id, r.name, r.description, r.floor_number, r.area_sqft, r.created_at
      ORDER BY r.floor_number, r.name
    `
    return rooms as Room[]
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return []
  }
}

export async function getRoomById(id: number) {
  try {
    const rooms = await sql`
      SELECT r.*, 
             COUNT(l.item_id) as item_count
      FROM rooms r
      LEFT JOIN locations l ON r.room_id = l.room_id
      WHERE r.room_id = ${id}
      GROUP BY r.room_id, r.name, r.description, r.floor_number, r.area_sqft, r.created_at
    `
    return rooms[0] as Room | null
  } catch (error) {
    console.error('Error fetching room:', error)
    return null
  }
}

export async function updateRoom(id: number, formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const floorNumber = formData.get("floorNumber") as string
  const areaSqft = formData.get("areaSqft") as string

  try {
    await sql`
      UPDATE rooms
      SET name = ${name}, description = ${description}, 
          floor_number = ${parseInt(floorNumber)}, area_sqft = ${areaSqft ? parseFloat(areaSqft) : null}
      WHERE room_id = ${id}
    `
    
    revalidatePath('/rooms')
    revalidatePath(`/rooms/${id}`)
    redirect(`/rooms/${id}`)
  } catch (error) {
    console.error('Error updating room:', error)
    throw new Error('Failed to update room')
  }
}

export async function deleteRoom(id: number) {
  try {
    await sql`DELETE FROM rooms WHERE room_id = ${id}`
    revalidatePath('/rooms')
    redirect('/rooms')
  } catch (error) {
    console.error('Error deleting room:', error)
    throw new Error('Failed to delete room')
  }
}

export async function getItemsInRoom(roomId: number) {
  try {
    const items = await sql`
      SELECT i.*
      FROM items i
      INNER JOIN locations l ON i.item_id = l.item_id
      WHERE l.room_id = ${roomId}
      ORDER BY i.name
    `
    return items
  } catch (error) {
    console.error('Error fetching items in room:', error)
    return []
  }
}
```

### lib/actions/dashboard.ts
```typescript
"use server"

import { sql } from "@/lib/db"

export async function getDashboardStats() {
  try {
    // Get counts
    const itemCount = await sql`SELECT COUNT(*) as count FROM items`
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`
    const mediaCount = await sql`SELECT COUNT(*) as count FROM media`
    
    // Get upcoming maintenance (next 30 days)
    const upcomingMaintenance = await sql`
      SELECT m.*, i.name as item_name
      FROM maintenance m
      JOIN items i ON m.item_id = i.item_id
      WHERE m.next_due <= CURRENT_DATE + INTERVAL '30 days'
        AND m.next_due >= CURRENT_DATE
      ORDER BY m.next_due ASC
      LIMIT 5
    `
    
    // Get recent items (last 30 days)
    const recentItems = await sql`
      SELECT item_id, name, created_at
      FROM items
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 5
    `
    
    return {
      counts: {
        items: itemCount[0]?.count || 0,
        rooms: roomCount[0]?.count || 0,
        media: mediaCount[0]?.count || 0,
      },
      upcomingMaintenance,
      recentItems,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      counts: {
        items: 0,
        rooms: 0,
        media: 0,
      },
      upcomingMaintenance: [],
      recentItems: [],
    }
  }
}
```

---

## State Management (Jotai)

### lib/atoms/atoms.ts
```typescript
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// UI State Atoms
export const sidebarOpenAtom = atomWithStorage('sidebar-open', true)
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system')
export const leftPanelExpandedAtom = atomWithStorage('left-panel-expanded', true)
export const rightPanelExpandedAtom = atomWithStorage('right-panel-expanded', true)
export const isLoadingAtom = atom(false)
export const uploadProgressAtom = atom(0)
export const processingStatusAtom = atom<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle')

// Search and Filter Atoms
export const searchQueryAtom = atom('')
export const activeFiltersAtom = atom<{
  category?: string
  room?: string
  condition?: string
  priceRange?: [number, number]
}>({})
export const selectedItemsAtom = atom<number[]>([])
export const selectedRoomsAtom = atom<number[]>([])
export const selectionModeAtom = atom<'single' | 'multi'>('single')

// View Preference Atoms
export const viewModeAtom = atomWithStorage<'grid' | 'list'>('view-mode', 'list')
export const sortByAtom = atom<'name' | 'date' | 'price' | 'category'>('name')
export const sortOrderAtom = atom<'asc' | 'desc'>('asc')

// Data Cache Atoms
export const itemsAtom = atom<any[]>([])
export const roomsAtom = atom<any[]>([])
export const tagsAtom = atom<any[]>([])
export const maintenanceTasksAtom = atom<any[]>([])
export const documentsAtom = atom<any[]>([])

// Notification Atoms
export const notificationAtom = atom<{
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  id: string
} | null>(null)

export const showNotificationAtom = atom(
  null,
  (get, set, notification: { message: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
    const id = Math.random().toString(36).substring(2, 9)
    set(notificationAtom, { ...notification, id })
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set(notificationAtom, null)
    }, 5000)
  }
)

// Form State Atoms
export const currentFormDataAtom = atom<Record<string, any>>({})
export const formErrorsAtom = atom<Record<string, string>>({})
export const formSubmittingAtom = atom(false)

// Modal State Atoms
export const activeModalAtom = atom<string | null>(null)
export const modalDataAtom = atom<any>(null)

// Dashboard State Atoms
export const dashboardStatsAtom = atom<{
  items: number
  rooms: number
  media: number
  upcomingMaintenance: any[]
  recentItems: any[]
}>({
  items: 0,
  rooms: 0,
  media: 0,
  upcomingMaintenance: [],
  recentItems: []
})

// Derived Atoms
export const filteredItemsAtom = atom((get) => {
  const items = get(itemsAtom)
  const query = get(searchQueryAtom)
  const filters = get(activeFiltersAtom)
  
  let filtered = items
  
  if (query) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.toLowerCase().includes(query.toLowerCase())
    )
  }
  
  if (filters.category) {
    filtered = filtered.filter(item => item.category === filters.category)
  }
  
  if (filters.room) {
    filtered = filtered.filter(item => item.room_id?.toString() === filters.room)
  }
  
  if (filters.condition) {
    filtered = filtered.filter(item => item.condition === filters.condition)
  }
  
  return filtered
})

export const sortedItemsAtom = atom((get) => {
  const items = get(filteredItemsAtom)
  const sortBy = get(sortByAtom)
  const sortOrder = get(sortOrderAtom)
  
  const sorted = [...items].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'date') {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    } else if (sortBy === 'price') {
      aValue = parseFloat(a.purchase_price || '0')
      bValue = parseFloat(b.purchase_price || '0')
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  return sorted
})

// Selection Atoms
export const selectedItemCountAtom = atom((get) => get(selectedItemsAtom).length)
export const hasSelectedItemsAtom = atom((get) => get(selectedItemsAtom).length > 0)

// Utility Atoms
export const resetFiltersAtom = atom(null, (get, set) => {
  set(searchQueryAtom, '')
  set(activeFiltersAtom, {})
  set(selectedItemsAtom, [])
})

export const selectAllItemsAtom = atom(null, (get, set) => {
  const items = get(filteredItemsAtom)
  const selectedItems = get(selectedItemsAtom)
  
  if (selectedItems.length === items.length) {
    set(selectedItemsAtom, [])
  } else {
    set(selectedItemsAtom, items.map(item => item.item_id))
  }
})
```

### lib/atoms/ai.ts
```typescript
import { atom } from 'jotai'
import type { DetectedItem, AIAnalysisResult } from '@/lib/services/ai-service'

// Image and Analysis State
export const currentImageAtom = atom<File | null>(null)
export const imagePreviewUrlAtom = atom<string | null>(null)
export const aiAnalysisLoadingAtom = atom(false)
export const aiAnalysisErrorAtom = atom<string | null>(null)
export const aiAnalysisResultAtom = atom<AIAnalysisResult | null>(null)

// Detected Items State
export const detectedItemsAtom = atom<DetectedItem[]>([])
export const selectedDetectedItemsAtom = atom<number[]>([])
export const hoveredDetectedItemAtom = atom<number | null>(null)

// UI State
export const selectionModeAtom = atom<'select' | 'crop' | 'view'>('view')
export const imageZoomAtom = atom(1)
export const imagePanAtom = atom({ x: 0, y: 0 })
export const processingStepAtom = atom<'upload' | 'analyze' | 'review' | 'complete'>('upload')

// Derived State
export const hasDetectedItemsAtom = atom((get) => get(detectedItemsAtom).length > 0)
export const selectedItemsCountAtom = atom((get) => get(selectedDetectedItemsAtom).length)
export const boundingBoxesAtom = atom((get) => {
  const detectedItems = get(detectedItemsAtom)
  return detectedItems.map(item => item.boundingBox)
})

// Action Atoms
export const startAnalysisAtom = atom(null, (get, set) => {
  set(aiAnalysisLoadingAtom, true)
  set(aiAnalysisErrorAtom, null)
  set(processingStepAtom, 'analyze')
})

export const setAnalysisResultAtom = atom(null, (get, set, result: AIAnalysisResult) => {
  set(aiAnalysisResultAtom, result)
  set(detectedItemsAtom, result.items)
  set(aiAnalysisLoadingAtom, false)
  set(processingStepAtom, 'review')
})

export const setAnalysisErrorAtom = atom(null, (get, set, error: string) => {
  set(aiAnalysisErrorAtom, error)
  set(aiAnalysisLoadingAtom, false)
  set(processingStepAtom, 'upload')
})

export const clearAnalysisAtom = atom(null, (get, set) => {
  set(currentImageAtom, null)
  set(imagePreviewUrlAtom, null)
  set(aiAnalysisResultAtom, null)
  set(detectedItemsAtom, [])
  set(selectedDetectedItemsAtom, [])
  set(hoveredDetectedItemAtom, null)
  set(aiAnalysisErrorAtom, null)
  set(processingStepAtom, 'upload')
})

export const resetImageViewAtom = atom(null, (get, set) => {
  set(imageZoomAtom, 1)
  set(imagePanAtom, { x: 0, y: 0 })
  set(selectionModeAtom, 'view')
})

export const toggleDetectedItemSelectionAtom = atom(null, (get, set, index: number) => {
  const selected = get(selectedDetectedItemsAtom)
  const isSelected = selected.includes(index)
  
  if (isSelected) {
    set(selectedDetectedItemsAtom, selected.filter(i => i !== index))
  } else {
    set(selectedDetectedItemsAtom, [...selected, index])
  }
})

export const zoomInAtom = atom(null, (get, set) => {
  const currentZoom = get(imageZoomAtom)
  set(imageZoomAtom, Math.min(currentZoom * 1.2, 3))
})

export const zoomOutAtom = atom(null, (get, set) => {
  const currentZoom = get(imageZoomAtom)
  set(imageZoomAtom, Math.max(currentZoom / 1.2, 0.5))
})
```

---

## Core Utilities & Types

### lib/types.ts
```typescript
// Existing types
export interface Item {
  item_id: number
  name: string
  description: string | null
  category: string | null
  purchase_date: string | null
  purchase_price: number | null
  condition: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Additional fields from the database
  purchased_from: string | null
  serial_number: string | null
  warranty_provider: string | null
  warranty_expiration: string | null
  storage_location: string | null
  current_value: number | null
  depreciation_rate: number | null
  has_insurance: boolean
  insurance_provider: string | null
  insurance_policy: string | null
  insurance_coverage: number | null
  insurance_category: string | null
  needs_maintenance: boolean
  maintenance_interval: number | null
  maintenance_instructions: string | null
  // Relations
  room?: {
    room_id: number
    name: string
    floor_number: number
  }
  media?: Media[]
  tags?: Tag[]
  maintenance?: Maintenance[]
}

export interface Room {
  room_id: number
  name: string
  description: string | null
  floor_number: number
  area_sqft: number | null
  created_at: string
}

export interface Maintenance {
  maintenance_id: number
  item_id: number
  item_name?: string
  maintenance_type: string
  frequency_days: number | null
  last_performed: string | null
  next_due: string | null
  instructions: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  document_id: number
  title: string
  description: string | null
  content: string | null
  category: string | null
  status: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Media {
  media_id: number
  item_id: number
  media_type: string
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  metadata: any
  created_at: string
}

export interface Tag {
  tag_id: number
  name: string
  color: string | null
  item_count?: number
}

export interface User {
  user_id: number
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type RoomFormData = {
  name: string
  description: string | null
  floor_number: string
  area_sqft: string | null
}
```

### lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num)
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

### lib/db.ts
```typescript
import { neon } from "@neondatabase/serverless"

// Create a SQL client with the Neon database URL
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute raw SQL queries with better error handling
export async function executeQuery(query: string, params: any[] = []) {
try {
// Use sql.query for parameterized queries
if (params && params.length > 0) {
const result = await sql.query(query, params)
return result.rows || []
} else {
// Use tagged template for simple queries
// We need to convert the string to a template literal execution
const result = await sql(query)
return result || []
}
} catch (error) {
console.error("Database query error:", error)
// Return an empty array instead of throwing to prevent rendering errors
return []
}
}
```

---

## Quick Reference Guide

### Finding Code by Feature
- **User Interface** → `components/ui/`
- **Data Operations** → `lib/actions/`
- **State Management** → `lib/atoms/`
- **Type Definitions** → `lib/types.ts`
- **Database** → `lib/db.ts`

### Finding Code by Page Type
- **List Pages** → `page.tsx` files with tables
- **Form Pages** → `new/` and `edit/` directories
- **Detail Pages** → `[id]/page.tsx` files
- **API Endpoints** → `app/api/` directory

### Key Patterns
- **Server Actions** → `"use server"` functions in `lib/actions/`
- **Client Components** → `"use client"` components with interactivity
- **Jotai Atoms** → State definitions in `lib/atoms/`
- **Type Safety** → Interface definitions in `lib/types.ts`

### Functional Areas
- **Item Management** → `/items`, `lib/actions/items.ts`, `Item` interface
- **Room Management** → `/rooms`, `lib/actions/rooms.ts`, `Room` interface
- **Maintenance** → `/maintenance`, `Maintenance` interface
- **AI Analysis** → `/items/ai-analysis`, `lib/atoms/ai.ts`
- **Documentation** → `/documentation`, `Document` interface

---

*Generated: 2025-07-06 - Total Files: 21*
*Single Column Format - Black & White - Optimized for Obsidian* 