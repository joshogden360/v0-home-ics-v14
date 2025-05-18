"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createDocument } from "@/lib/actions/documents"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, Plus, Trash2, FileText, LinkIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Item, Room, Maintenance } from "@/lib/types"
import { Editor } from "@/components/editor"

export function NewDocumentForm({
  items,
  rooms,
  maintenanceItems,
}: {
  items: Item[]
  rooms: Room[]
  maintenanceItems: Maintenance[]
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [content, setContent] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviewNames, setFilePreviewNames] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedRooms, setSelectedRooms] = useState<number[]>([])
  const [selectedMaintenance, setSelectedMaintenance] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if title field exists and is not empty
      const title = formData.get("title") as string
      if (!title || title.trim() === "") {
        setError("Document title is required")
        setIsSubmitting(false)
        return
      }

      // Create a new FormData object to ensure we don't lose any fields
      const enhancedFormData = new FormData()

      // First, copy all original form fields
      for (const [key, value] of formData.entries()) {
        enhancedFormData.append(key, value)
      }

      // Add the document content
      enhancedFormData.append("content", content)

      // Add the files to the form data
      selectedFiles.forEach((file, index) => {
        enhancedFormData.append(`file_${index}`, file)
      })

      // Add selected relations
      selectedItems.forEach((itemId, index) => {
        enhancedFormData.append(`item_${index}`, itemId.toString())
      })

      selectedRooms.forEach((roomId, index) => {
        enhancedFormData.append(`room_${index}`, roomId.toString())
      })

      selectedMaintenance.forEach((maintenanceId, index) => {
        enhancedFormData.append(`maintenance_${index}`, maintenanceId.toString())
      })

      const result = await createDocument(enhancedFormData)

      if (result.success) {
        router.push(`/documentation/${result.id}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to create document")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating document:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles([...selectedFiles, ...newFiles])

      // Store file names for preview
      const newFileNames = newFiles.map((file) => file.name)
      setFilePreviewNames([...filePreviewNames, ...newFileNames])
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles]
    const updatedFileNames = [...filePreviewNames]

    updatedFiles.splice(index, 1)
    updatedFileNames.splice(index, 1)

    setSelectedFiles(updatedFiles)
    setFilePreviewNames(updatedFileNames)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const toggleRoomSelection = (roomId: number) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter((id) => id !== roomId))
    } else {
      setSelectedRooms([...selectedRooms, roomId])
    }
  }

  const toggleMaintenanceSelection = (maintenanceId: number) => {
    if (selectedMaintenance.includes(maintenanceId)) {
      setSelectedMaintenance(selectedMaintenance.filter((id) => id !== maintenanceId))
    } else {
      setSelectedMaintenance([...selectedMaintenance, maintenanceId])
    }
  }

  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("content")
    else if (activeTab === "content") setActiveTab("files")
    else if (activeTab === "files") setActiveTab("relations")
  }

  const prevTab = () => {
    if (activeTab === "relations") setActiveTab("files")
    else if (activeTab === "files") setActiveTab("content")
    else if (activeTab === "content") setActiveTab("basic")
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="relations">Relations</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>Enter the basic details of your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required aria-required="true" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="specification">Specification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Provide a brief description of this document..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="created_by">Author</Label>
                <Input id="created_by" name="created_by" placeholder="Document author or creator" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="button" onClick={nextTab}>
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
              <CardDescription>Write or paste the content of your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[400px] border rounded-md">
                <Editor value={content} onChange={setContent} />
              </div>
              <input type="hidden" name="content" value={content} />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="button" onClick={nextTab}>
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Document Files</CardTitle>
              <CardDescription>Attach files to this document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Attached Files</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filePreviewNames.map((name, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div
                    className="border border-dashed rounded-md flex items-center justify-center p-4 cursor-pointer hover:bg-muted transition-colors"
                    onClick={triggerFileInput}
                  >
                    <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add File</span>
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                </div>
                <div className="flex items-center justify-center">
                  <Button type="button" variant="outline" className="w-full" onClick={triggerFileInput}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>File Notes</Label>
                <Textarea name="file_notes" rows={3} placeholder="Add any notes about the uploaded files..." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="button" onClick={nextTab}>
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Relations Tab */}
        <TabsContent value="relations">
          <Card>
            <CardHeader>
              <CardTitle>Document Relations</CardTitle>
              <CardDescription>Link this document to items, rooms, or maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Related Items
                  </h3>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.item_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`item-${item.item_id}`}
                              checked={selectedItems.includes(item.item_id)}
                              onCheckedChange={() => toggleItemSelection(item.item_id)}
                            />
                            <Label htmlFor={`item-${item.item_id}`} className="cursor-pointer">
                              {item.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No items available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Related Rooms
                  </h3>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    {rooms.length > 0 ? (
                      <div className="space-y-2">
                        {rooms.map((room) => (
                          <div key={room.room_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`room-${room.room_id}`}
                              checked={selectedRooms.includes(room.room_id)}
                              onCheckedChange={() => toggleRoomSelection(room.room_id)}
                            />
                            <Label htmlFor={`room-${room.room_id}`} className="cursor-pointer">
                              {room.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No rooms available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Related Maintenance
                  </h3>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    {maintenanceItems.length > 0 ? (
                      <div className="space-y-2">
                        {maintenanceItems.map((maintenance) => (
                          <div key={maintenance.maintenance_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`maintenance-${maintenance.maintenance_id}`}
                              checked={selectedMaintenance.includes(maintenance.maintenance_id)}
                              onCheckedChange={() => toggleMaintenanceSelection(maintenance.maintenance_id)}
                            />
                            <Label htmlFor={`maintenance-${maintenance.maintenance_id}`} className="cursor-pointer">
                              {maintenance.maintenance_type} - {maintenance.item_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No maintenance tasks available</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Document"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
