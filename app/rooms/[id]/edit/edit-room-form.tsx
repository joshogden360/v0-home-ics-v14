"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { updateRoom } from "@/lib/actions/rooms"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Camera,
  Upload,
  Plus,
  Trash2,
  Ruler,
  Calendar,
  FileText,
  Grid3X3,
  CuboidIcon as Cube,
  Lightbulb,
  Scan,
  ArrowUpRight,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Room, Item } from "@/lib/types"

interface EditRoomFormProps {
  room: Room
  items: Item[]
  roomItems: Item[]
  roomMedia: any[]
  roomDocuments: any[]
}

export function EditRoomForm({ room, items, roomItems, roomMedia, roomDocuments }: EditRoomFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [documentPreviewNames, setDocumentPreviewNames] = useState<string[]>([])
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null)
  const [floorplanPreview, setFloorplanPreview] = useState<string | null>(null)
  const [lastCleanedDate, setLastCleanedDate] = useState<Date | undefined>(
    room.last_cleaned ? new Date(room.last_cleaned) : undefined,
  )
  const [selectedItems, setSelectedItems] = useState<number[]>(roomItems.map((item) => item.item_id))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const floorplanInputRef = useRef<HTMLInputElement>(null)

  // Set initial floorplan preview if available
  useEffect(() => {
    const floorplan = roomMedia.find((media) => media.file_type === "floorplan")
    if (floorplan) {
      setFloorplanPreview(floorplan.file_path)
    }
  }, [roomMedia])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if name field exists and is not empty
      const name = formData.get("name") as string
      if (!name || name.trim() === "") {
        setError("Room name is required")
        setIsSubmitting(false)
        return
      }

      // Create a new FormData object to ensure we don't lose any fields
      const enhancedFormData = new FormData()

      // First, copy all original form fields
      for (const [key, value] of formData.entries()) {
        enhancedFormData.append(key, value)
      }

      // Add the photos to the form data
      selectedPhotos.forEach((photo, index) => {
        enhancedFormData.append(`photo_${index}`, photo)
      })

      // Add the documents to the form data
      selectedDocuments.forEach((document, index) => {
        enhancedFormData.append(`document_${index}`, document)
      })

      // Add the floorplan if available
      if (floorplanFile) {
        enhancedFormData.append("floorplan", floorplanFile)
      }

      // Add selected items
      selectedItems.forEach((itemId, index) => {
        enhancedFormData.append(`item_${index}`, itemId.toString())
      })

      // Add last cleaned date if available
      if (lastCleanedDate) {
        enhancedFormData.append("last_cleaned", format(lastCleanedDate, "yyyy-MM-dd"))
      }

      const result = await updateRoom(room.room_id, enhancedFormData)

      if (result.success) {
        router.push(`/rooms/${room.room_id}`)
      } else {
        setError(result.error || "Failed to update room")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error updating room:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedPhotos([...selectedPhotos, ...newFiles])

      // Create preview URLs for the new photos
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls])
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedDocuments([...selectedDocuments, ...newFiles])

      // Store document names for preview
      const newDocumentNames = newFiles.map((file) => file.name)
      setDocumentPreviewNames([...documentPreviewNames, ...newDocumentNames])
    }
  }

  const handleFloorplanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setFloorplanFile(file)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setFloorplanPreview(previewUrl)
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = [...selectedPhotos]
    const updatedPreviewUrls = [...photoPreviewUrls]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedPreviewUrls[index])

    updatedPhotos.splice(index, 1)
    updatedPreviewUrls.splice(index, 1)

    setSelectedPhotos(updatedPhotos)
    setPhotoPreviewUrls(updatedPreviewUrls)
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = [...selectedDocuments]
    const updatedDocumentNames = [...documentPreviewNames]

    updatedDocuments.splice(index, 1)
    updatedDocumentNames.splice(index, 1)

    setSelectedDocuments(updatedDocuments)
    setDocumentPreviewNames(updatedDocumentNames)
  }

  const removeFloorplan = () => {
    if (floorplanPreview) {
      URL.revokeObjectURL(floorplanPreview)
    }
    setFloorplanFile(null)
    setFloorplanPreview(null)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const triggerDocumentInput = () => {
    if (documentInputRef.current) {
      documentInputRef.current.click()
    }
  }

  const triggerFloorplanInput = () => {
    if (floorplanInputRef.current) {
      floorplanInputRef.current.click()
    }
  }

  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("visualization")
    else if (activeTab === "visualization") setActiveTab("contents")
    else if (activeTab === "contents") setActiveTab("characteristics")
    else if (activeTab === "characteristics") setActiveTab("documentation")
    else if (activeTab === "documentation") setActiveTab("maintenance")
  }

  const prevTab = () => {
    if (activeTab === "maintenance") setActiveTab("documentation")
    else if (activeTab === "documentation") setActiveTab("characteristics")
    else if (activeTab === "characteristics") setActiveTab("contents")
    else if (activeTab === "contents") setActiveTab("visualization")
    else if (activeTab === "visualization") setActiveTab("basic")
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
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="contents">Contents</TabsTrigger>
          <TabsTrigger value="characteristics">Characteristics</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>Edit the basic details of your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required aria-required="true" defaultValue={room.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor_number">Floor Number</Label>
                  <Input id="floor_number" name="floor_number" type="number" defaultValue={room.floor_number || 1} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq ft)</Label>
                  <Input
                    id="area_sqft"
                    name="area_sqft"
                    type="number"
                    step="0.01"
                    defaultValue={room.area_sqft || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select name="room_type" defaultValue={room.room_type || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Living Room">Living Room</SelectItem>
                      <SelectItem value="Bedroom">Bedroom</SelectItem>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Bathroom">Bathroom</SelectItem>
                      <SelectItem value="Dining Room">Dining Room</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Hallway">Hallway</SelectItem>
                      <SelectItem value="Closet">Closet</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                  placeholder="Describe the room..."
                  defaultValue={room.description || ""}
                />
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

        {/* Visualization Tab */}
        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle>Room Visualization</CardTitle>
              <CardDescription>Upload or create a visual representation of your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 justify-center mb-4">
                <Button type="button" variant="outline" onClick={triggerFloorplanInput}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Floorplan
                </Button>
                <Button type="button" variant="outline">
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Draw Room
                </Button>
                <Button type="button" variant="outline">
                  <Ruler className="mr-2 h-4 w-4" />
                  Use AR Measure
                </Button>
                <input
                  ref={floorplanInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFloorplanChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Floorplan Preview</Label>
                {floorplanPreview ? (
                  <div className="relative border rounded-md overflow-hidden">
                    <img
                      src={floorplanPreview || "/placeholder.svg"}
                      alt="Room floorplan"
                      className="w-full object-contain max-h-[300px]"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeFloorplan}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-muted transition-colors"
                    onClick={triggerFloorplanInput}
                  >
                    <Cube className="h-16 w-16 mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload a floorplan or blueprint of your room</p>
                    <p className="text-xs text-muted-foreground mt-2">Supported formats: JPG, PNG, PDF</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Room Photos</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing photos from the database */}
                  {roomMedia
                    .filter((media) => media.file_type === "photo")
                    .map((media, index) => (
                      <div
                        key={`existing-${media.media_id}`}
                        className="relative aspect-square rounded-md overflow-hidden border"
                      >
                        <img
                          src={media.file_path || "/placeholder.svg"}
                          alt={`Room view ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <input type="hidden" name={`existing_photo_${media.media_id}`} value={media.media_id} />
                        {/* We're not implementing delete for existing photos in this example */}
                      </div>
                    ))}

                  {/* New photos to be uploaded */}
                  {photoPreviewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`New room view ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center p-4 cursor-pointer aspect-square hover:bg-muted transition-colors"
                    onClick={triggerFileInput}
                  >
                    <Plus className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="flex items-center justify-center mt-4">
                  <Button type="button" variant="outline" className="w-full" onClick={triggerFileInput}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Room Photos
                  </Button>
                  <Button type="button" variant="outline" className="ml-2">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable_3d">Enable 3D Room Preview</Label>
                  <Switch id="enable_3d" name="enable_3d" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Create a 3D model of your room to visualize item placement
                </p>
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

        {/* Contents Tab */}
        <TabsContent value="contents">
          <Card>
            <CardHeader>
              <CardTitle>Room Contents</CardTitle>
              <CardDescription>Manage items located in this room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Items in this Room</Label>
                <div className="border rounded-md p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedItems.length > 0 ? (
                      selectedItems.map((itemId) => {
                        const item = items.find((i) => i.item_id === itemId)
                        return (
                          <Badge key={itemId} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            {item?.name || `Item ${itemId}`}
                            <button
                              type="button"
                              onClick={() => toggleItemSelection(itemId)}
                              className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Remove item</span>
                            </button>
                          </Badge>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No items assigned to this room yet</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add_item">Add Existing Items</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select onValueChange={(value) => toggleItemSelection(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items
                            .filter((item) => !selectedItems.includes(item.item_id))
                            .map((item) => (
                              <SelectItem key={item.item_id} value={item.item_id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Item
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Item Placement</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="aspect-video relative bg-muted rounded-md flex items-center justify-center">
                    {floorplanPreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={floorplanPreview || "/placeholder.svg"}
                          alt="Room floorplan"
                          className="w-full h-full object-contain opacity-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded">
                            Drag items onto the floorplan to position them
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Cube className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Upload a floorplan in the Visualization tab to enable item placement
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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

        {/* Characteristics Tab */}
        <TabsContent value="characteristics">
          <Card>
            <CardHeader>
              <CardTitle>Room Characteristics</CardTitle>
              <CardDescription>Document the physical attributes of your room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wall_color">Wall Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wall_color"
                      name="wall_color"
                      placeholder="e.g., Eggshell White"
                      defaultValue={room.wall_color || ""}
                    />
                    <Input
                      type="color"
                      id="wall_color_hex"
                      name="wall_color_hex"
                      className="w-12 h-10 p-1"
                      defaultValue={room.wall_color_hex || "#ffffff"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flooring_type">Flooring Type</Label>
                  <Select name="flooring_type" defaultValue={room.flooring_type || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flooring type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardwood">Hardwood</SelectItem>
                      <SelectItem value="Carpet">Carpet</SelectItem>
                      <SelectItem value="Tile">Tile</SelectItem>
                      <SelectItem value="Laminate">Laminate</SelectItem>
                      <SelectItem value="Vinyl">Vinyl</SelectItem>
                      <SelectItem value="Concrete">Concrete</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Window Dimensions</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="window_count" className="text-sm">
                      Number of Windows
                    </Label>
                    <Input
                      id="window_count"
                      name="window_count"
                      type="number"
                      min="0"
                      defaultValue={room.window_count || 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="window_width" className="text-sm">
                      Width (inches)
                    </Label>
                    <Input
                      id="window_width"
                      name="window_width"
                      type="number"
                      step="0.1"
                      defaultValue={room.window_width || ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="window_height" className="text-sm">
                      Height (inches)
                    </Label>
                    <Input
                      id="window_height"
                      name="window_height"
                      type="number"
                      step="0.1"
                      defaultValue={room.window_height || ""}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lighting</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="ceiling_lights" className="text-sm">
                      Ceiling Fixtures
                    </Label>
                    <Input
                      id="ceiling_lights"
                      name="ceiling_lights"
                      placeholder="e.g., 2 recessed lights"
                      defaultValue={room.ceiling_lights || ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wall_lights" className="text-sm">
                      Wall Fixtures
                    </Label>
                    <Input
                      id="wall_lights"
                      name="wall_lights"
                      placeholder="e.g., 1 sconce"
                      defaultValue={room.wall_lights || ""}
                    />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Built-in lighting fixtures only (not lamps)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifying_features">Identifying Features</Label>
                <Textarea
                  id="identifying_features"
                  name="identifying_features"
                  rows={3}
                  placeholder="e.g., Crown molding, built-in bookshelf, fireplace"
                  defaultValue={room.identifying_features || ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_closet">Has Closet</Label>
                  <Switch id="has_closet" name="has_closet" defaultChecked={room.has_closet} />
                </div>
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

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Room Documentation</CardTitle>
              <CardDescription>Upload documents related to this room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Documents</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Existing documents */}
                  {roomDocuments.map((doc) => (
                    <div
                      key={`existing-${doc.document_id}`}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                      <input type="hidden" name={`existing_document_${doc.document_id}`} value={doc.document_id} />
                      {/* We're not implementing delete for existing documents in this example */}
                    </div>
                  ))}

                  {/* New documents to be uploaded */}
                  {documentPreviewNames.map((name, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeDocument(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div
                    className="border border-dashed rounded-md flex items-center justify-center p-4 cursor-pointer hover:bg-muted transition-colors"
                    onClick={triggerDocumentInput}
                  >
                    <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Document</span>
                  </div>
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    multiple
                    className="hidden"
                    onChange={handleDocumentChange}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <Button type="button" variant="outline" className="w-full" onClick={triggerDocumentInput}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents
                  </Button>
                  <Button type="button" variant="outline" className="ml-2" title="Scan document">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Document Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lease"
                      name="document_types"
                      value="lease"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("lease"))}
                    />
                    <Label htmlFor="lease" className="text-sm font-normal">
                      Lease Agreement
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="paint"
                      name="document_types"
                      value="paint"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("paint"))}
                    />
                    <Label htmlFor="paint" className="text-sm font-normal">
                      Paint Specifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="measurements"
                      name="document_types"
                      value="measurements"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("measurements"))}
                    />
                    <Label htmlFor="measurements" className="text-sm font-normal">
                      Measurements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="repairs"
                      name="document_types"
                      value="repairs"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("repairs"))}
                    />
                    <Label htmlFor="repairs" className="text-sm font-normal">
                      Repair History
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="warranty"
                      name="document_types"
                      value="warranty"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("warranty"))}
                    />
                    <Label htmlFor="warranty" className="text-sm font-normal">
                      Warranty Information
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="other"
                      name="document_types"
                      value="other"
                      className="rounded"
                      defaultChecked={roomDocuments.some((doc) => doc.document_type?.includes("other"))}
                    />
                    <Label htmlFor="other" className="text-sm font-normal">
                      Other
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document_notes">Document Notes</Label>
                <Textarea
                  id="document_notes"
                  name="document_notes"
                  rows={3}
                  placeholder="Add any notes about the uploaded documents..."
                  defaultValue={roomDocuments[0]?.notes || ""}
                />
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

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Room Maintenance</CardTitle>
              <CardDescription>Track maintenance tasks specific to this room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Last Cleaned</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {lastCleanedDate ? format(lastCleanedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={lastCleanedDate}
                      onSelect={setLastCleanedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="painting_needed">Painting Needed</Label>
                  <Select name="painting_needed" defaultValue={room.painting_needed || "No"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes - Minor">Yes - Minor Touch-ups</SelectItem>
                      <SelectItem value="Yes - Major">Yes - Major Repainting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaning_frequency">Cleaning Frequency (days)</Label>
                  <Input
                    id="cleaning_frequency"
                    name="cleaning_frequency"
                    type="number"
                    defaultValue={room.cleaning_frequency || 30}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="air_filter_location">Air Filter Location</Label>
                <Input
                  id="air_filter_location"
                  name="air_filter_location"
                  placeholder="e.g., North wall near ceiling"
                  defaultValue={room.air_filter_location || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                <Textarea
                  id="maintenance_notes"
                  name="maintenance_notes"
                  rows={3}
                  placeholder="Add any special maintenance instructions for this room..."
                  defaultValue={room.maintenance_notes || ""}
                />
              </div>

              <div className="space-y-2">
                <Label>Repair History</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="flex items-center">
                    <ArrowUpRight className="h-5 w-5 mr-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Repair history will be available after you save the room
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Room"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
