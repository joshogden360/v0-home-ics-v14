"use client"

import { useState } from "react"
import { createDocumentVersion } from "@/lib/actions/documents"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor"
import type { Document } from "@/lib/types"

export function NewVersionForm({ document }: { document: Document }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState(document.content || "")

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Create a new FormData object
      const enhancedFormData = new FormData()

      // Copy all original form fields
      for (const [key, value] of formData.entries()) {
        enhancedFormData.append(key, value)
      }

      // Add the document content
      enhancedFormData.append("content", content)
      enhancedFormData.append("document_id", document.document_id.toString())

      const result = await createDocumentVersion(enhancedFormData)

      if (result.success) {
        router.push(`/documentation/${document.document_id}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to create document version")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating document version:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Version Details</CardTitle>
          <CardDescription>Create a new version of this document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="version_number">Version Number</Label>
            <Input id="version_number" name="version_number" type="number" defaultValue="1" min="1" step="1" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="change_notes">Change Notes</Label>
            <Textarea
              id="change_notes"
              name="change_notes"
              rows={3}
              placeholder="Describe what changed in this version..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="created_by">Author</Label>
            <Input
              id="created_by"
              name="created_by"
              defaultValue={document.created_by || ""}
              placeholder="Version author"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Document Content</Label>
            <div className="min-h-[400px] border rounded-md">
              <Editor value={content} onChange={setContent} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Version"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
