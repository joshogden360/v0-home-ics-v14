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
import {
  itemFormAtom,
  uploadedFilesAtom,
  photoPreviewUrlsAtom,
  documentPreviewNamesAtom,
  clearItemFormAtom,
  showNotificationAtom
} from "@/lib/atoms/atoms"
import { useAtom, useSetAtom } from "jotai"

export function NewItemForm({ rooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [formState, setFormState] = useAtom(itemFormAtom)
  const [uploadedFiles, setUploadedFiles] = useAtom(uploadedFilesAtom)
  const [photoPreviewUrls, setPhotoPreviewUrls] = useAtom(photoPreviewUrlsAtom)
  const [documentPreviewNames, setDocumentPreviewNames] = useAtom(documentPreviewNamesAtom)
  const clearForm = useSetAtom(clearItemFormAtom)
  const showNotification = useSetAtom(showNotificationAtom)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Clear error when name is entered
  useEffect(() => {
    if (formState.formData.name && formState.error && formState.error.includes("name")) {
      setFormState(prev => ({ ...prev, error: null }))
    }
  }, [formState.formData.name, formState.error, setFormState])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Validate required fields
      if (!formState.formData.name || formState.formData.name.trim() === "") {
        setFormState(prev => ({ 
          ...prev, 
          error: "Item name is required",
          activeTab: "basic",
          isSubmitting: false
        }))
        return
      }

      // Create FormData object
      const formDataObj = new FormData()

      // Explicitly add all form fields to ensure they're included
      Object.entries(formState.formData).forEach(([key, value]) => {
        formDataObj.append(key, value || "")
      })

      // Add the purchase date from the selected date
      if (formState.selectedDate) {
        formDataObj.append("purchase_date", format(formState.selectedDate, "yyyy-MM-dd"))
      }

      // Add the warranty date from the selected warranty date
      if (formState.selectedWarrantyDate) {
        formDataObj.append("warranty_expiration", format(formState.selectedWarrantyDate, "yyyy-MM-dd"))
      }

      // Add the purchase price
      formDataObj.append("purchase_price", formState.purchasePrice.toString())

      // Add the current value
      formDataObj.append("current_value", formState.currentValue.toString())

      // Add insurance status
      formDataObj.append("has_insurance", formState.hasInsurance.toString())

      // Add maintenance status
      formDataObj.append("needs_maintenance", formState.needsMaintenance.toString())
      formDataObj.append("maintenance_interval", formState.maintenanceInterval.toString())

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
        showNotification({
          title: "Success",
          message: "Item created successfully",
          type: "success"
        })
        clearForm()
        router.push(`/items/${result.id}`)
      } else {
        // Handle error
        setFormState(prev => ({ 
          ...prev, 
          error: result.error || "Failed to create item",
          isSubmitting: false
        }))
      }
    } catch (error) {
      console.error("Error creating item:", error)
      setFormState(prev => ({ 
        ...prev, 
        error: "An unexpected error occurred. Please try again.",
        isSubmitting: false
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }))

    // Clear error when typing in the name field
    if (name === "name" && value && formState.error && formState.error.includes("name")) {
      setFormState(prev => ({ ...prev, error: null }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles(prev => ({
        ...prev,
        photos: [...prev.photos, ...newFiles]
      }))

      // Create preview URLs for the new photos
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls])
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }))

      // Store document names for preview
      const newDocumentNames = newFiles.map((file) => file.name)
      setDocumentPreviewNames(prev => [...prev, ...newDocumentNames])
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = [...uploadedFiles.photos]
    const updatedPreviewUrls = [...photoPreviewUrls]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedPreviewUrls[index])

    updatedPhotos.splice(index, 1)
    updatedPreviewUrls.splice(index, 1)

    setUploadedFiles(prev => ({ ...prev, photos: updatedPhotos }))
    setPhotoPreviewUrls(updatedPreviewUrls)
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = [...uploadedFiles.documents]
    const updatedDocumentNames = [...documentPreviewNames]

    updatedDocuments.splice(index, 1)
    updatedDocumentNames.splice(index, 1)

    setUploadedFiles(prev => ({ ...prev, documents: updatedDocuments }))
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
    if (formState.activeTab === "basic" && (!formState.formData.name || formState.formData.name.trim() === "")) {
      setFormState(prev => ({ ...prev, error: "Item name is required" }))
      return
    }

    const tabs = ["basic", "details", "media", "location", "value", "maintenance"]
    const currentIndex = tabs.indexOf(formState.activeTab)
    if (currentIndex < tabs.length - 1) {
      setFormState(prev => ({ ...prev, activeTab: tabs[currentIndex + 1] }))
    }
  }

  const prevTab = () => {
    const tabs = ["basic", "details", "media", "location", "value", "maintenance"]
    const currentIndex = tabs.indexOf(formState.activeTab)
    if (currentIndex > 0) {
      setFormState(prev => ({ ...prev, activeTab: tabs[currentIndex - 1] }))
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormState(prev => ({ ...prev, selectedDate: date }))
  }

  const handleWarrantyDateSelect = (date: Date | undefined) => {
    setFormState(prev => ({ ...prev, selectedWarrantyDate: date }))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {formState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formState.error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={formState.activeTab} onValueChange={(value) => setFormState(prev => ({ ...prev, activeTab: value }))} className="w-full">
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
                  value={formState.formData.name}
                  onChange={handleInputChange}
                  className={`${formState.error && formState.error.includes("name") ? "border-red-500" : "border-input"}`}
                  aria-invalid={formState.error && formState.error.includes("name") ? "true" : "false"}
                />
                {formState.error && formState.error.includes("name") && (
                  <p className="text-sm text-red-500" aria-live="polite">
                    {formState.error}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    name="category"
                    value={formState.formData.category}
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
                    value={formState.formData.condition}
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
                  value={formState.formData.description}
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
                        {formState.selectedDate ? format(formState.selectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formState.selectedDate}
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
                      value={formState.purchasePrice || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
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
                  value={formState.formData.purchased_from}
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
                    value={formState.formData.serial_number}
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
                      value={formState.formData.warranty_provider}
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
                          {formState.selectedWarrantyDate ? format(formState.selectedWarrantyDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formState.selectedWarrantyDate}
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
                <Textarea id="notes" name="notes" rows={2} value={formState.formData.notes} onChange={handleInputChange} />
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
                  value={formState.formData.storage_location}
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
                    value={formState.currentValue || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, currentValue: Number(e.target.value) }))}
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
                  <Switch id="has_insurance" checked={formState.hasInsurance} onCheckedChange={(value) => setFormState(prev => ({ ...prev, hasInsurance: value }))} />
                </div>
              </div>

              {formState.hasInsurance && (
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
                  <Switch 
                    id="needs_maintenance" 
                    name="needs_maintenance" 
                    checked={formState.needsMaintenance}
                    onCheckedChange={(value) => setFormState(prev => ({ ...prev, needsMaintenance: value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_interval">Recommended Maintenance Interval (days)</Label>
                <Input 
                  id="maintenance_interval" 
                  name="maintenance_interval" 
                  type="number" 
                  value={formState.maintenanceInterval}
                  onChange={(e) => setFormState(prev => ({ ...prev, maintenanceInterval: Number(e.target.value) }))}
                />
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
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Creating..." : "Create Item"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
