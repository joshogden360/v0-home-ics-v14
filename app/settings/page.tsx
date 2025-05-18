import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sql } from "@/lib/db"

export default async function SettingsPage() {
  // Get database stats with error handling
  const itemCount = await sql`SELECT COUNT(*) as count FROM items`
  const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`
  const mediaCount = await sql`SELECT COUNT(*) as count FROM media`
  const maintenanceCount = await sql`SELECT COUNT(*) as count FROM maintenance`
  const tagCount = await sql`SELECT COUNT(*) as count FROM tags`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input id="app_name" defaultValue="Apartment Inventory" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" defaultValue="USD" />
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
              <CardDescription>View information about your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Items</p>
                    <p className="mt-2 text-2xl font-bold">{itemCount[0]?.count || 0}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Rooms</p>
                    <p className="mt-2 text-2xl font-bold">{roomCount[0]?.count || 0}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Media Files</p>
                    <p className="mt-2 text-2xl font-bold">{mediaCount[0]?.count || 0}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Maintenance Tasks</p>
                    <p className="mt-2 text-2xl font-bold">{maintenanceCount[0]?.count || 0}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Tags</p>
                    <p className="mt-2 text-2xl font-bold">{tagCount[0]?.count || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Information about this application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Apartment Inventory</h3>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>

              <div>
                <h4 className="font-medium">Technologies</h4>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  <li>Next.js</li>
                  <li>Neon PostgreSQL</li>
                  <li>Tailwind CSS</li>
                  <li>shadcn/ui</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
