"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createItem } from "@/lib/actions/items"
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
  QrCode,
  Calendar,
  DollarSign,
  MapPin,
  PenToolIcon as Tool,
  FileText,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { Room } from "@/lib/types"

export function NewItemForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedWarrantyDate, setSelectedWarrantyDate] = useState<Date | undefined>(undefined)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [documentPreviewNames, setDocumentPreviewNames] = useState<string[]>([])
  const [currentValue, setCurrentValue] = useState<number>(0)
  const [purchasePrice, setPurchasePrice] = useState<number>(0)
  const [hasInsurance, setHasInsurance] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    condition: "",
    purchased_from: "",
    serial_number: "",
    warranty_provider: "",
    storage_location: "",
    notes: "",
  })

  // Clear error when name is entered
  useEffect(() => {
    if (formData.name && error && error.includes("name")) {
      setError(null)
    }
  }, [formData.name, error])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === "") {
        setError("Item name is required")
        setActiveTab("basic") // Go back to the basic tab where the name field is
        setIsSubmitting(false)
        return
      }

      // Create FormData object
      const formDataObj = new FormData()

      // Explicitly add all form fields to ensure they're included
      formDataObj.append("name", formData.name)
      formDataObj.append("description", formData.description || "")
      formDataObj.append("category", formData.category || "")
      formDataObj.append("condition", formData.condition || "")
      formDataObj.append("purchased_from", formData.purchased_from || "")
      formDataObj.append("serial_number", formData.serial_number || "")
      formDataObj.append("warranty_provider", formData.warranty_provider || "")
      formDataObj.append("storage_location", formData.storage_location || "")
      formDataObj.append("notes", formData.notes || "")

      // Add the purchase date from the selected date
      if (selectedDate) {
        formDataObj.append("purchase_date", format(selectedDate, "yyyy-MM-dd"))
      }

      // Add the warranty date from the selected warranty date
      if (selectedWarrantyDate) {
        formDataObj.append("warranty_expiration", format(selectedWarrantyDate, "yyyy-MM-dd"))
      }

      // Add the purchase price
      formDataObj.append("purchase_price", purchasePrice.toString())

      // Add the current value
      formDataObj.append("current_value", currentValue.toString())

      // Add insurance status
      formDataObj.append("has_insurance", hasInsurance.toString())

      // Get room_id from the form if it exists
      if (formRef.current) {
        const roomSelect = formRef.current.querySelector('select[name="room_id"]') as HTMLSelectElement
        if (roomSelect && roomSelect.value) {
          formDataObj.append("room_id", roomSelect.value)
        }
      }

      // Call the server action
      const result = await createItem(formDataObj)

      if (result.success && result.id) {
        router.push(`/items/${result.id}`)
      } else {
        // Handle error
        setError(result.error || "Failed to create item")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating item:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when typing in the name field
    if (name === "name" && value && error && error.includes("name")) {
      setError(null)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const nextTab = () => {
    // Only validate name when moving from basic tab
    if (activeTab === "basic" && (!formData.name || formData.name.trim() === "")) {
      setError("Item name is required")
      return
    }

    if (activeTab === "basic") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("media")
    else if (activeTab === "media") setActiveTab("location")
    else if (activeTab === "location") setActiveTab("value")
    else if (activeTab === "value") setActiveTab("maintenance")
  }

  const prevTab = () => {
    if (activeTab === "maintenance") setActiveTab("value")
    else if (activeTab === "value") setActiveTab("location")
    else if (activeTab === "location") setActiveTab("media")
    else if (activeTab === "media") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("basic")
  }

  // Simplified date selection handlers
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleWarrantyDateSelect = (date: Date | undefined) => {
    setSelectedWarrantyDate(date)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="value">Value</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the essential details about your item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  aria-required="true"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${error && error.includes("name") ? "border-red-500" : "border-input"}`}
                  aria-invalid={error && error.includes("name") ? "true" : "false"}
                />
                {error && error.includes("name") && (
                  <p className="text-sm text-red-500" aria-live="polite">
                    {error}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="Kitchenware">Kitchenware</SelectItem>
                      <SelectItem value="Decor">Decor</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    name="condition"
                    value={formData.condition}
                    onValueChange={(value) => handleSelectChange("condition", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
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
                  placeholder="Describe your item..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" disabled>
                Back
              </Button>
              <Button type="button" onClick={nextTab}>
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Add purchase and warranty information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.01"
                      value={purchasePrice || ""}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchased_from">Purchased From</Label>
                <Input
                  id="purchased_from"
                  name="purchased_from"
                  placeholder="Store or website name"
                  value={formData.purchased_from}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <div className="flex">
                  <Input
                    id="serial_number"
                    name="serial_number"
                    className="rounded-r-none"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none"
                    title="Scan barcode"
                    onClick={(e) => e.preventDefault()}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Warranty Information</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="warranty_provider" className="text-sm">
                      Provider
                    </Label>
                    <Input
                      id="warranty_provider"
                      name="warranty_provider"
                      value={formData.warranty_provider}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty_expiration" className="text-sm">
                      Expiration Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedWarrantyDate ? format(selectedWarrantyDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedWarrantyDate}
                          onSelect={handleWarrantyDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} value={formData.notes} onChange={handleInputChange} />
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

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Attachments</CardTitle>
              <CardDescription>Add photos and documents for your item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Photos</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index}`}
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
                <div className="flex items-center justify-center">
                  <Button type="button" variant="outline" className="w-full" onClick={triggerFileInput}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </Button>
                  <Button type="button" variant="outline" className="ml-2">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Documents & Receipts</Label>
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
                    <Camera className="h-4 w-4" />
                  </Button>
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

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Item Location</CardTitle>
              <CardDescription>Specify where this item is located</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rooms.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="room_id">Room</Label>
                  <Select name="room_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.room_id} value={room.room_id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="storage_location">Storage Container/Box</Label>
                <Input
                  id="storage_location"
                  name="storage_location"
                  placeholder="e.g., Blue Storage Box, Kitchen Cabinet"
                  value={formData.storage_location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Specific Location</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="aspect-video relative bg-muted rounded-md flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Apartment map view</span>
                    <input type="hidden" name="x_coordinate" />
                    <input type="hidden" name="y_coordinate" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Click on the map to pinpoint the exact location of this item
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="generate_qr">Generate QR Code Label</Label>
                  <Switch id="generate_qr" name="generate_qr" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Generate a QR code that you can print and attach to this item for easy identification
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

        {/* Value Tab */}
        <TabsContent value="value">
          <Card>
            <CardHeader>
              <CardTitle>Value Information</CardTitle>
              <CardDescription>Track the value and insurance details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current_value">Current Estimated Value</Label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="current_value"
                    type="number"
                    step="0.01"
                    value={currentValue || ""}
                    onChange={(e) => setCurrentValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Depreciation Rate</Label>
                <div className="space-y-4">
                  <Slider defaultValue={[10]} max={50} step={1} name="depreciation_rate" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_insurance">Insured Item</Label>
                  <Switch id="has_insurance" checked={hasInsurance} onCheckedChange={setHasInsurance} />
                </div>
              </div>

              {hasInsurance && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="insurance_provider">Insurance Provider</Label>
                    <Input id="insurance_provider" name="insurance_provider" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_policy">Policy Number</Label>
                    <Input id="insurance_policy" name="insurance_policy" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_coverage">Coverage Amount</Label>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Input id="insurance_coverage" name="insurance_coverage" type="number" step="0.01" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="insurance_category">Insurance Category</Label>
                <Select name="insurance_category">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Collectibles">Collectibles</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
              <CardTitle>Maintenance Information</CardTitle>
              <CardDescription>Set up maintenance schedules for this item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="needs_maintenance">Requires Regular Maintenance</Label>
                  <Switch id="needs_maintenance" name="needs_maintenance" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_interval">Recommended Maintenance Interval (days)</Label>
                <Input id="maintenance_interval" name="maintenance_interval" type="number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_instructions">Maintenance Instructions</Label>
                <Textarea
                  id="maintenance_instructions"
                  name="maintenance_instructions"
                  rows={3}
                  placeholder="Describe the maintenance procedures..."
                />
              </div>

              <div className="rounded-md border p-4 bg-muted/20">
                <div className="flex items-center">
                  <Tool className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Maintenance Schedule</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  A maintenance schedule will be created automatically after you save this item. You can add detailed
                  maintenance tasks from the item's detail page.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Item"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
