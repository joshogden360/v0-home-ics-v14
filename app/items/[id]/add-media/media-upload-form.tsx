"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadItemMedia } from "@/lib/actions/media"
import { FileText, ImageIcon, Music, Video, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type React from "react"

export function MediaUploadForm({ itemId, itemName }: { itemId: number; itemName: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState("image")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)
    setUploadProgress(0)

    // Create preview for images
    if (selectedFile && selectedFile.type.startsWith("image")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }

    // Auto-detect media type
    if (selectedFile) {
      if (selectedFile.type.startsWith("image")) {
        setMediaType("image")
      } else if (selectedFile.type.startsWith("video")) {
        setMediaType("video")
      } else if (selectedFile.type.startsWith("audio")) {
        setMediaType("audio")
      } else {
        setMediaType("document")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsUploading(true)
    setUploadProgress(10) // Start progress

    try {
      // Create a new FormData object
      const formData = new FormData()
      formData.append("item_id", itemId.toString())
      formData.append("media_type", mediaType)
      formData.append("description", description)
      formData.append("file", file)

      setUploadProgress(30) // Update progress

      // Call the server action
      const result = await uploadItemMedia(formData)

      setUploadProgress(100) // Complete progress

      if (result.success) {
        console.log("Upload successful, navigating to item page")
        router.push(`/items/${itemId}`)
        router.refresh()
      } else {
        console.error("Upload failed:", result.error)
        setError(result.error || "Failed to upload media")
        setUploadProgress(0)
      }
    } catch (err) {
      console.error("Error during upload:", err)
      setError("An unexpected error occurred during upload")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const getMediaIcon = () => {
    switch (mediaType) {
      case "image":
        return <ImageIcon className="h-6 w-6" />
      case "video":
        return <Video className="h-6 w-6" />
      case "audio":
        return <Music className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>Add images, documents, or other files related to {itemName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div
              className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-full max-w-md">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Preview"
                    className="rounded-md max-h-48 mx-auto object-contain"
                  />
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a file or drag and drop it here</p>
                  <p className="text-xs text-muted-foreground mt-1">Files will be stored in Vercel Blob</p>
                </>
              )}
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,application/pdf,text/*"
              />
              {file && (
                <div className="mt-2 text-sm flex items-center">
                  {getMediaIcon()}
                  <span className="ml-2">{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="w-full bg-muted rounded-full h-2.5 mb-4">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mediaType">Media Type</Label>
            <Select value={mediaType} onValueChange={setMediaType}>
              <SelectTrigger id="mediaType">
                <SelectValue placeholder="Select media type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this file"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading || !file}>
            {isUploading ? `Uploading (${uploadProgress}%)...` : "Upload to Vercel Blob"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
