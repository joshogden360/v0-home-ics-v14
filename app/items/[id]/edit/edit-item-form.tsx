"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateItem } from "@/lib/actions/items"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  room_id: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  purchased_from: z.string().optional(),
  serial_number: z.string().optional(),
  warranty_provider: z.string().optional(),
  warranty_expiration: z.string().optional(),
  storage_location: z.string().optional(),
  current_value: z.string().optional(),
  depreciation_rate: z.string().optional(),
  has_insurance: z.boolean().optional(),
  insurance_provider: z.string().optional(),
  insurance_policy: z.string().optional(),
  insurance_coverage: z.string().optional(),
  insurance_category: z.string().optional(),
  needs_maintenance: z.boolean().optional(),
  maintenance_interval: z.string().optional(),
  maintenance_instructions: z.string().optional(),
})

export default function EditItemForm({ item, rooms }: { item: any; rooms: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name || "",
      description: item.description || "",
      category: item.category || "",
      room_id: item.room?.room_id?.toString() || "",
      purchase_date: item.purchase_date || "",
      purchase_price: item.purchase_price?.toString() || "",
      condition: item.condition || "",
      notes: item.notes || "",
      purchased_from: item.purchased_from || "",
      serial_number: item.serial_number || "",
      warranty_provider: item.warranty_provider || "",
      warranty_expiration: item.warranty_expiration || "",
      storage_location: item.storage_location || "",
      current_value: item.current_value?.toString() || "",
      depreciation_rate: item.depreciation_rate?.toString() || "",
      has_insurance: item.has_insurance || false,
      insurance_provider: item.insurance_provider || "",
      insurance_policy: item.insurance_policy || "",
      insurance_coverage: item.insurance_coverage?.toString() || "",
      insurance_category: item.insurance_category || "",
      needs_maintenance: item.needs_maintenance || false,
      maintenance_interval: item.maintenance_interval?.toString() || "",
      maintenance_instructions: item.maintenance_instructions || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      const result = await updateItem(item.item_id, formData)

      if (result.success) {
        router.push(`/items/${item.item_id}`)
        router.refresh()
      } else {
        console.error("Failed to update item:", result.error)
      }
    } catch (error) {
      console.error("Error updating item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="appliance">Appliance</SelectItem>
                      <SelectItem value="decor">Decor</SelectItem>
                      <SelectItem value="kitchenware">Kitchenware</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Room</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.room_id} value={room.room_id.toString()}>
                          {room.name} (Floor {room.floor_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="broken">Broken</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchased_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchased From</FormLabel>
                <FormControl>
                  <Input placeholder="Store or seller name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="Serial number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warranty_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warranty Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Warranty provider" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warranty_expiration"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Warranty Expiration</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storage_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <FormControl>
                  <Input placeholder="Specific location within room" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Value</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="depreciation_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depreciation Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="has_insurance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Insurance</FormLabel>
                  <FormDescription>Does this item have insurance coverage?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Insurance company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_policy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="Policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_coverage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Coverage Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homeowners">Homeowners</SelectItem>
                      <SelectItem value="renters">Renters</SelectItem>
                      <SelectItem value="valuable_items">Valuable Items</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="needs_maintenance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Maintenance Required</FormLabel>
                  <FormDescription>Does this item need regular maintenance?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenance_interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Interval (days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Item description" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maintenance_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Instructions</FormLabel>
              <FormControl>
                <Textarea placeholder="Instructions for maintaining this item" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
