import { getTags } from "@/lib/actions/tags"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Manage tags for categorizing your items</p>
        </div>
        <Link href="/tags/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <Card key={tag.tag_id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tag.name}</CardTitle>
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color || "#cbd5e1" }} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tag.item_count} {tag.item_count === 1 ? "item" : "items"}
                </p>
                <div className="mt-4 flex justify-end">
                  <Link href={`/tags/${tag.tag_id}`}>
                    <Button variant="ghost" size="sm">
                      View Items
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No tags found. Create your first tag to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
