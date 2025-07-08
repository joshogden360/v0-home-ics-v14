"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createRoom } from "@/lib/actions/rooms-secure"
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
import { getItems } from "@/lib/actions/items-auth0-simple"
import { useEffect } from "react"
import type { Item } from "@/lib/types"

export function NewRoomForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    floor_number: "1",
    area_sqft: "",
    room_type: "",
    has_closet: false,
    wall_color: "",
    wall_color_hex: "",
    flooring_type: "",
    window_count: "0",
    window_width: "",
    window_height: "",
    ceiling_lights: "",
    wall_lights: "",
    identifying_features: "",
    cleaning_frequency: "30",
    painting_needed: "",
    air_filter_location: "",
    maintenance_notes: "",
  })
  
  // Media and other state
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [documentPreviewNames, setDocumentPreviewNames] = useState<string[]>([])
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null)
  const [floorplanPreview, setFloorplanPreview] = useState<string | null>(null)
  const [lastCleanedDate, setLastCleanedDate] = useState<Date>()
  const [items, setItems] = useState<Item[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const floorplanInputRef = useRef<HTMLInputElement>(null)

  // Fetch items for the room contents section
  useEffect(() => {
    async function fetchItems() {
      try {
        const fetchedItems = await getItems()
        setItems(fetchedItems as Item[])
      } catch (error) {
        console.error("Error fetching items:", error)
      }
    }

    fetchItems()
  }, [])

  // Handle form field changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault()
    }
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if name field exists and is not empty
      if (!formData.name || formData.name.trim() === "") {
        setError("Room name is required")
        setIsSubmitting(false)
        return
      }

      // Create a FormData object from state
      const enhancedFormData = new FormData()

      // Add all form fields from state
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          enhancedFormData.append(key, value.toString())
        }
      })

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

      const result = await createRoom(enhancedFormData)

      if (result.success) {
        router.push(`/rooms/${result.id}`)
      } else {
        setError(result.error || "Failed to create room")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating room:", error)
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
              <CardDescription>Enter the basic details of your new room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    required 
                    aria-required="true" 
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor_number">Floor Number</Label>
                  <Input 
                    id="floor_number" 
                    name="floor_number" 
                    type="number" 
                    value={formData.floor_number}
                    onChange={(e) => handleInputChange("floor_number", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_sqft">Area (sq ft)</Label>
                  <Input 
                    id="area_sqft" 
                    name="area_sqft" 
                    type="number" 
                    step="0.01" 
                    value={formData.area_sqft}
                    onChange={(e) => handleInputChange("area_sqft", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select 
                    name="room_type" 
                    value={formData.room_type} 
                    onValueChange={(value) => handleInputChange("room_type", value)}
                  >
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
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" disabled>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              </div>
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
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Room view ${index + 1}`}
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
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              </div>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              </div>
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
                      value={formData.wall_color}
                      onChange={(e) => handleInputChange("wall_color", e.target.value)}
                    />
                    <Input
                      type="color"
                      id="wall_color_hex"
                      name="wall_color_hex"
                      className="w-12 h-10 p-1"
                      value={formData.wall_color_hex || "#ffffff"}
                      onChange={(e) => handleInputChange("wall_color_hex", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flooring_type">Flooring Type</Label>
                  <Select 
                    name="flooring_type" 
                    value={formData.flooring_type} 
                    onValueChange={(value) => handleInputChange("flooring_type", value)}
                  >
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
                    <Input id="window_count" name="window_count" type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="window_width" className="text-sm">
                      Width (inches)
                    </Label>
                    <Input id="window_width" name="window_width" type="number" step="0.1" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="window_height" className="text-sm">
                      Height (inches)
                    </Label>
                    <Input id="window_height" name="window_height" type="number" step="0.1" />
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
                    <Input id="ceiling_lights" name="ceiling_lights" placeholder="e.g., 2 recessed lights" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wall_lights" className="text-sm">
                      Wall Fixtures
                    </Label>
                    <Input id="wall_lights" name="wall_lights" placeholder="e.g., 1 sconce" />
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
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_closet">Has Closet</Label>
                  <Switch id="has_closet" name="has_closet" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              </div>
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
                  {documentPreviewNames.map((name, index) => (
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
                    <input type="checkbox" id="lease" name="document_types" value="lease" className="rounded" />
                    <Label htmlFor="lease" className="text-sm font-normal">
                      Lease Agreement
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="paint" name="document_types" value="paint" className="rounded" />
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
                    />
                    <Label htmlFor="measurements" className="text-sm font-normal">
                      Measurements
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="repairs" name="document_types" value="repairs" className="rounded" />
                    <Label htmlFor="repairs" className="text-sm font-normal">
                      Repair History
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="warranty" name="document_types" value="warranty" className="rounded" />
                    <Label htmlFor="warranty" className="text-sm font-normal">
                      Warranty Information
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="other" name="document_types" value="other" className="rounded" />
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
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Room"}
                </Button>
                <Button type="button" onClick={nextTab}>
                  Next
                </Button>
              </div>
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
                  <Select 
                    name="painting_needed" 
                    value={formData.painting_needed} 
                    onValueChange={(value) => handleInputChange("painting_needed", value)}
                  >
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
                    value={formData.cleaning_frequency}
                    onChange={(e) => handleInputChange("cleaning_frequency", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="air_filter_location">Air Filter Location</Label>
                <Input
                  id="air_filter_location"
                  name="air_filter_location"
                  placeholder="e.g., North wall near ceiling"
                  value={formData.air_filter_location}
                  onChange={(e) => handleInputChange("air_filter_location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                <Textarea
                  id="maintenance_notes"
                  name="maintenance_notes"
                  rows={3}
                  placeholder="Add any special maintenance instructions for this room..."
                  value={formData.maintenance_notes}
                  onChange={(e) => handleInputChange("maintenance_notes", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Repair History</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="flex items-center">
                    <ArrowUpRight className="h-5 w-5 mr-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Repair history will be available after you create the room
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
                {isSubmitting ? "Creating..." : "Create Room"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
