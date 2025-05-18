"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createMaintenance } from "@/lib/actions/maintenance"
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
  Calendar,
  FileText,
  Clock,
  DollarSign,
  ExternalLink,
  Info,
  Mail,
  BellRing,
  CalendarDays,
  Users,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, addDays, addMonths } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { getItemById } from "@/lib/actions/items"
import { getRoomById } from "@/lib/actions/rooms"
import type { Item } from "@/lib/types"

export function NewMaintenanceForm({ items: initialItems }: { items: Item[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("item")
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [maintenanceType, setMaintenanceType] = useState<string>("")
  const [frequencyDays, setFrequencyDays] = useState<number>(90)
  const [recurrencePattern, setRecurrencePattern] = useState<string>("monthly")
  const [lastPerformedDate, setLastPerformedDate] = useState<Date>()
  const [nextDueDate, setNextDueDate] = useState<Date>()
  const [maintenanceCost, setMaintenanceCost] = useState<number>(0)
  const [emailNotification, setEmailNotification] = useState<boolean>(true)
  const [appNotification, setAppNotification] = useState<boolean>(true)
  const [calendarNotification, setCalendarNotification] = useState<boolean>(false)
  const [assignToHousehold, setAssignToHousehold] = useState<boolean>(false)
  const [remindWeekBefore, setRemindWeekBefore] = useState<boolean>(true)
  const [remindDayBefore, setRemindDayBefore] = useState<boolean>(true)
  const [selectedBeforePhotos, setSelectedBeforePhotos] = useState<File[]>([])
  const [beforePhotoPreviewUrls, setBeforePhotoPreviewUrls] = useState<string[]>([])
  const [selectedAfterPhotos, setSelectedAfterPhotos] = useState<File[]>([])
  const [afterPhotoPreviewUrls, setAfterPhotoPreviewUrls] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [documentPreviewNames, setDocumentPreviewNames] = useState<string[]>([])
  const [items, setItems] = useState<Item[]>(initialItems || [])
  const beforePhotoInputRef = useRef<HTMLInputElement>(null)
  const afterPhotoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // Suggested maintenance types based on item category
  const maintenanceTypesByCategory: Record<string, string[]> = {
    Electronics: ["Cleaning", "Software Update", "Battery Replacement", "Hardware Check"],
    Furniture: ["Cleaning", "Polishing", "Repair", "Reupholstery"],
    Appliances: ["Deep Cleaning", "Filter Replacement", "Inspection", "Part Replacement"],
    Kitchenware: ["Deep Cleaning", "Sharpening", "Descaling"],
    Tools: ["Cleaning", "Sharpening", "Lubrication", "Calibration"],
    Other: ["General Maintenance", "Cleaning", "Inspection"],
  }

  // Suggested frequencies based on maintenance type
  const suggestedFrequencies: Record<string, number> = {
    Cleaning: 30,
    "Deep Cleaning": 90,
    "Software Update": 30,
    "Battery Replacement": 365,
    "Filter Replacement": 90,
    Inspection: 180,
    "Part Replacement": 365,
    Polishing: 180,
    Repair: 0, // One-time
    Reupholstery: 0, // One-time
    Sharpening: 180,
    Descaling: 90,
    Lubrication: 90,
    Calibration: 180,
    "General Maintenance": 90,
    "Hardware Check": 180,
  }

  // Estimated time to complete based on maintenance type (in minutes)
  const estimatedTimes: Record<string, number> = {
    Cleaning: 30,
    "Deep Cleaning": 60,
    "Software Update": 45,
    "Battery Replacement": 20,
    "Filter Replacement": 15,
    Inspection: 30,
    "Part Replacement": 60,
    Polishing: 45,
    Repair: 90,
    Reupholstery: 0, // Professional service
    Sharpening: 30,
    Descaling: 45,
    Lubrication: 20,
    Calibration: 30,
    "General Maintenance": 45,
    "Hardware Check": 30,
  }

  // Fetch item details when an item is selected
  useEffect(() => {
    async function fetchItemDetails() {
      if (!selectedItemId) {
        setSelectedItem(null)
        setSelectedRoom(null)
        return
      }

      try {
        const item = await getItemById(Number(selectedItemId))
        setSelectedItem(item)

        // If the item has a room, fetch room details
        if (item?.room?.room_id) {
          const room = await getRoomById(item.room.room_id)
          setSelectedRoom(room)
        } else {
          setSelectedRoom(null)
        }

        // Set suggested maintenance type based on item category
        if (item?.category && maintenanceTypesByCategory[item.category]) {
          setMaintenanceType(maintenanceTypesByCategory[item.category][0])
        } else {
          setMaintenanceType("General Maintenance")
        }
      } catch (error) {
        console.error("Error fetching item details:", error)
      }
    }

    fetchItemDetails()
  }, [selectedItemId])

  // Update frequency when maintenance type changes
  useEffect(() => {
    if (maintenanceType && suggestedFrequencies[maintenanceType]) {
      setFrequencyDays(suggestedFrequencies[maintenanceType])
    }
  }, [maintenanceType])

  // Update next due date when last performed date or frequency changes
  useEffect(() => {
    if (lastPerformedDate && frequencyDays > 0) {
      if (recurrencePattern === "daily") {
        setNextDueDate(addDays(lastPerformedDate, frequencyDays))
      } else if (recurrencePattern === "monthly") {
        setNextDueDate(addMonths(lastPerformedDate, Math.ceil(frequencyDays / 30)))
      } else if (recurrencePattern === "yearly") {
        setNextDueDate(addMonths(lastPerformedDate, 12))
      } else {
        setNextDueDate(addDays(lastPerformedDate, frequencyDays))
      }
    }
  }, [lastPerformedDate, frequencyDays, recurrencePattern])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if item is selected
      const itemId = formData.get("item_id") as string
      if (!itemId) {
        setError("Please select an item for maintenance")
        setIsSubmitting(false)
        return
      }

      // Check if maintenance type is selected
      const maintenanceType = formData.get("maintenance_type") as string
      if (!maintenanceType) {
        setError("Please select a maintenance type")
        setIsSubmitting(false)
        return
      }

      // Create a new FormData object to ensure we don't lose any fields
      const enhancedFormData = new FormData()

      // First, copy all original form fields
      for (const [key, value] of formData.entries()) {
        enhancedFormData.append(key, value)
      }

      // Add the before photos to the form data
      selectedBeforePhotos.forEach((photo, index) => {
        enhancedFormData.append(`before_photo_${index}`, photo)
      })

      // Add the after photos to the form data
      selectedAfterPhotos.forEach((photo, index) => {
        enhancedFormData.append(`after_photo_${index}`, photo)
      })

      // Add the documents to the form data
      selectedDocuments.forEach((document, index) => {
        enhancedFormData.append(`document_${index}`, document)
      })

      // Add notification preferences
      enhancedFormData.append("email_notification", emailNotification.toString())
      enhancedFormData.append("app_notification", appNotification.toString())
      enhancedFormData.append("calendar_notification", calendarNotification.toString())
      enhancedFormData.append("assign_to_household", assignToHousehold.toString())
      enhancedFormData.append("remind_week_before", remindWeekBefore.toString())
      enhancedFormData.append("remind_day_before", remindDayBefore.toString())

      // Add maintenance cost
      enhancedFormData.append("estimated_cost", maintenanceCost.toString())

      // Add recurrence pattern
      enhancedFormData.append("recurrence_pattern", recurrencePattern)

      const result = await createMaintenance(enhancedFormData)

      if (result.success && result.id) {
        router.push(`/maintenance/${result.id}`)
      } else {
        setError(result.error || "Failed to create maintenance task")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating maintenance task:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleBeforePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedBeforePhotos([...selectedBeforePhotos, ...newFiles])

      // Create preview URLs for the new photos
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setBeforePhotoPreviewUrls([...beforePhotoPreviewUrls, ...newPreviewUrls])
    }
  }

  const handleAfterPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedAfterPhotos([...selectedAfterPhotos, ...newFiles])

      // Create preview URLs for the new photos
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setAfterPhotoPreviewUrls([...afterPhotoPreviewUrls, ...newPreviewUrls])
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

  const removeBeforePhoto = (index: number) => {
    const updatedPhotos = [...selectedBeforePhotos]
    const updatedPreviewUrls = [...beforePhotoPreviewUrls]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedPreviewUrls[index])

    updatedPhotos.splice(index, 1)
    updatedPreviewUrls.splice(index, 1)

    setSelectedBeforePhotos(updatedPhotos)
    setBeforePhotoPreviewUrls(updatedPreviewUrls)
  }

  const removeAfterPhoto = (index: number) => {
    const updatedPhotos = [...selectedAfterPhotos]
    const updatedPreviewUrls = [...afterPhotoPreviewUrls]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedPreviewUrls[index])

    updatedPhotos.splice(index, 1)
    updatedPreviewUrls.splice(index, 1)

    setSelectedAfterPhotos(updatedPhotos)
    setAfterPhotoPreviewUrls(updatedPreviewUrls)
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = [...selectedDocuments]
    const updatedDocumentNames = [...documentPreviewNames]

    updatedDocuments.splice(index, 1)
    updatedDocumentNames.splice(index, 1)

    setSelectedDocuments(updatedDocuments)
    setDocumentPreviewNames(updatedDocumentNames)
  }

  const triggerBeforePhotoInput = () => {
    if (beforePhotoInputRef.current) {
      beforePhotoInputRef.current.click()
    }
  }

  const triggerAfterPhotoInput = () => {
    if (afterPhotoInputRef.current) {
      afterPhotoInputRef.current.click()
    }
  }

  const triggerDocumentInput = () => {
    if (documentInputRef.current) {
      documentInputRef.current.click()
    }
  }

  const nextTab = () => {
    if (activeTab === "item") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("schedule")
    else if (activeTab === "schedule") setActiveTab("notifications")
    else if (activeTab === "notifications") setActiveTab("documentation")
  }

  const prevTab = () => {
    if (activeTab === "documentation") setActiveTab("notifications")
    else if (activeTab === "notifications") setActiveTab("schedule")
    else if (activeTab === "schedule") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("item")
  }

  // Get suggested maintenance types for the selected item
  const getSuggestedMaintenanceTypes = () => {
    if (selectedItem?.category && maintenanceTypesByCategory[selectedItem.category]) {
      return maintenanceTypesByCategory[selectedItem.category]
    }
    return maintenanceTypesByCategory.Other
  }

  // Get estimated time for selected maintenance type
  const getEstimatedTime = () => {
    if (maintenanceType && estimatedTimes[maintenanceType]) {
      return estimatedTimes[maintenanceType]
    }
    return 30 // Default 30 minutes
  }

  // Calculate annual maintenance cost
  const getAnnualMaintenanceCost = () => {
    if (frequencyDays <= 0) return maintenanceCost // One-time cost
    const maintenancesPerYear = 365 / frequencyDays
    return (maintenanceCost * maintenancesPerYear).toFixed(2)
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
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="item">Item</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* Item Tab */}
        <TabsContent value="item">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Select the item that needs maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="item_id">Item *</Label>
                <div className="flex gap-2">
                  <Select name="item_id" value={selectedItemId} onValueChange={setSelectedItemId} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.item_id} value={item.item_id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedItemId && (
                    <Button type="button" variant="outline" size="icon" title="View Item Details">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {selectedItem && (
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                        {selectedItem.media && selectedItem.media.length > 0 ? (
                          <img
                            src={selectedItem.media[0].file_path || "/placeholder.svg"}
                            alt={selectedItem.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-grow space-y-2">
                      <h3 className="font-medium text-lg">{selectedItem.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>{" "}
                          {selectedItem.category || "Uncategorized"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>{" "}
                          {selectedRoom ? selectedRoom.name : "Unassigned"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Purchase Date:</span>{" "}
                          {selectedItem.purchase_date
                            ? format(new Date(selectedItem.purchase_date), "MM/dd/yyyy")
                            : "Unknown"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Condition:</span>{" "}
                          {selectedItem.condition || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedItem.maintenance && selectedItem.maintenance.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Maintenance History</h4>
                      <div className="space-y-2">
                        {selectedItem.maintenance.map((maintenance: any) => (
                          <div key={maintenance.maintenance_id} className="flex justify-between text-sm">
                            <span>{maintenance.maintenance_type}</span>
                            <span className="text-muted-foreground">
                              {maintenance.last_performed
                                ? `Last performed: ${format(new Date(maintenance.last_performed), "MM/dd/yyyy")}`
                                : "Never performed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedItem && selectedItemId && (
                <div className="flex items-center justify-center h-32 border rounded-md">
                  <p className="text-muted-foreground">Loading item details...</p>
                </div>
              )}

              {!selectedItemId && (
                <div className="flex flex-col items-center justify-center h-32 border rounded-md border-dashed">
                  <Info className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">
                    Select an item to view details and create a maintenance task
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="button" onClick={nextTab} disabled={!selectedItemId}>
                Next
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Details</CardTitle>
              <CardDescription>Specify the type of maintenance needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maintenance_type">Maintenance Type *</Label>
                <Select name="maintenance_type" value={maintenanceType} onValueChange={setMaintenanceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSuggestedMaintenanceTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {maintenanceType === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_maintenance_type">Custom Maintenance Type</Label>
                  <Input
                    id="custom_maintenance_type"
                    name="custom_maintenance_type"
                    placeholder="Enter custom maintenance type"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Suggested Frequency</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{frequencyDays > 0 ? `Every ${frequencyDays} days` : "One-time maintenance"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Time</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{getEstimatedTime()} minutes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parts_needed">Parts/Materials Needed</Label>
                <Textarea
                  id="parts_needed"
                  name="parts_needed"
                  rows={2}
                  placeholder="List any parts or materials needed for this maintenance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  rows={4}
                  placeholder="Provide detailed instructions for this maintenance task"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="manufacturer_instructions">Include Manufacturer Instructions</Label>
                  <Switch id="manufacturer_instructions" name="manufacturer_instructions" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically include manufacturer-recommended maintenance instructions if available
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

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Set up the maintenance schedule and frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="frequency_days">Frequency (days)</Label>
                <Input
                  id="frequency_days"
                  name="frequency_days"
                  type="number"
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Leave empty or set to 0 for one-time maintenance</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                <Select name="recurrence_pattern" value={recurrencePattern} onValueChange={setRecurrencePattern}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Last Performed</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {lastPerformedDate ? format(lastPerformedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={lastPerformedDate}
                        onSelect={setLastPerformedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    name="last_performed"
                    value={lastPerformedDate ? format(lastPerformedDate, "yyyy-MM-dd") : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Next Due</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {nextDueDate ? format(nextDueDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={nextDueDate} onSelect={setNextDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="next_due" value={nextDueDate ? format(nextDueDate, "yyyy-MM-dd") : ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Maintenance Timeline</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="relative h-12 mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed"></div>
                    </div>
                    <div className="relative flex justify-between">
                      {lastPerformedDate && (
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-primary"></div>
                          <span className="text-xs mt-1">Last Performed</span>
                          <span className="text-xs text-muted-foreground">
                            {format(lastPerformedDate, "MM/dd/yyyy")}
                          </span>
                        </div>
                      )}
                      {nextDueDate && (
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                          <span className="text-xs mt-1">Next Due</span>
                          <span className="text-xs text-muted-foreground">{format(nextDueDate, "MM/dd/yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {frequencyDays > 0
                      ? `Maintenance occurs every ${frequencyDays} days (${recurrencePattern})`
                      : "One-time maintenance task"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="estimated_cost"
                    name="estimated_cost"
                    type="number"
                    step="0.01"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lifecycle Information</Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Maintenance per year:</span>{" "}
                      <span className="text-sm font-medium">
                        {frequencyDays > 0 ? (365 / frequencyDays).toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Annual cost:</span>{" "}
                      <span className="text-sm font-medium">${getAnnualMaintenanceCost()}</span>
                    </div>
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

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to be notified about this maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Notification Methods</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email_notification"
                      checked={emailNotification}
                      onCheckedChange={setEmailNotification}
                    />
                    <Label htmlFor="email_notification" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notification
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="app_notification" checked={appNotification} onCheckedChange={setAppNotification} />
                    <Label htmlFor="app_notification" className="flex items-center gap-2">
                      <BellRing className="h-4 w-4" />
                      App Notification
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="calendar_notification"
                      checked={calendarNotification}
                      onCheckedChange={setCalendarNotification}
                    />
                    <Label htmlFor="calendar_notification" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Add to Calendar
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assign_to_household"
                      checked={assignToHousehold}
                      onCheckedChange={setAssignToHousehold}
                    />
                    <Label htmlFor="assign_to_household" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assign to Household
                    </Label>
                  </div>
                </div>
              </div>

              {assignToHousehold && (
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select name="assigned_to">
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person1">Person 1</SelectItem>
                      <SelectItem value="person2">Person 2</SelectItem>
                      <SelectItem value="person3">Person 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <Label>Reminder Schedule</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="remind_week_before" checked={remindWeekBefore} onCheckedChange={setRemindWeekBefore} />
                    <Label htmlFor="remind_week_before">1 week before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="remind_day_before" checked={remindDayBefore} onCheckedChange={setRemindDayBefore} />
                    <Label htmlFor="remind_day_before">1 day before</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_notes">Additional Notes</Label>
                <Textarea
                  id="notification_notes"
                  name="notification_notes"
                  rows={3}
                  placeholder="Add any additional notes for notifications..."
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

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Documentation</CardTitle>
              <CardDescription>Add documentation for this maintenance task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Before Photos</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {beforePhotoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Before photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeBeforePhoto(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center p-4 cursor-pointer aspect-square hover:bg-muted transition-colors"
                    onClick={triggerBeforePhotoInput}
                  >
                    <Plus className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </div>
                  <input
                    ref={beforePhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleBeforePhotoChange}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <Button type="button" variant="outline" className="w-full" onClick={triggerBeforePhotoInput}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Before Photos
                  </Button>
                  <Button type="button" variant="outline" className="ml-2">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>After Photos (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {afterPhotoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`After photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeAfterPhoto(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div
                    className="border border-dashed rounded-md flex flex-col items-center justify-center p-4 cursor-pointer aspect-square hover:bg-muted transition-colors"
                    onClick={triggerAfterPhotoInput}
                  >
                    <Plus className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </div>
                  <input
                    ref={afterPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAfterPhotoChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  After photos can be added later when the maintenance is performed
                </p>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentation_notes">Documentation Notes</Label>
                <Textarea
                  id="documentation_notes"
                  name="documentation_notes"
                  rows={3}
                  placeholder="Add any notes about the documentation..."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevTab}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Maintenance Task"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
