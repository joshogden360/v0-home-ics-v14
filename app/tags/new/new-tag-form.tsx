"use client"

import { useState } from "react"
import { createTag } from "@/lib/actions/tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function NewTagForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    await createTag(formData)
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Details</CardTitle>
        <CardDescription>Enter the details of your new tag</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" type="color" defaultValue="#3b82f6" className="w-20 h-10" />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
