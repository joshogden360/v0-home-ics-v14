"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Grid3X3, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickCapture } from './quick-capture'
import { BulkUpload } from './bulk-upload'
import { BoundingBoxEditor } from './bounding-box-editor'
import { createItem } from '@/lib/actions/items'
import type { Room } from '@/lib/types'

interface PhotoToItemsMinimalProps {
  rooms?: Room[]
}

export function PhotoToItemsMinimal({ rooms = [] }: PhotoToItemsMinimalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'quick' | 'bulk' | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<any[]>([])

  const handleQuickCapture = (items: any[]) => {
    setDetectedItems(prev => [...prev, ...items])
    // Quick save functionality
    saveSingleItem(items[0])
  }

  const saveSingleItem = async (item: any) => {
    try {
      const formData = new FormData()
      formData.append('name', item.label)
      formData.append('description', `Quick capture: ${item.label}`)
      formData.append('category', item.label.split(' ')[0])
      
      await createItem(formData)
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const handleBulkComplete = (results: any[]) => {
    const allItems = results.flatMap(r => r.items)
    setDetectedItems(allItems)
    // Navigate to review page or show inline review
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-2xl font-medium mb-2">Create Items</h1>
            <p className="text-muted-foreground">Choose your workflow</p>
          </div>

          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Quick Capture */}
            <button
              onClick={() => setMode('quick')}
              className={cn(
                "group relative overflow-hidden",
                "border rounded-lg p-8 text-left",
                "hover:border-primary transition-all",
                "bg-card hover:bg-accent/5"
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <Camera className="h-8 w-8" />
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-medium mb-2">Quick Capture</h3>
                <p className="text-sm text-muted-foreground">
                  Snap and save items on the go. Perfect for single items.
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Bulk Upload */}
            <button
              onClick={() => setMode('bulk')}
              className={cn(
                "group relative overflow-hidden",
                "border rounded-lg p-8 text-left",
                "hover:border-primary transition-all",
                "bg-card hover:bg-accent/5"
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <Grid3X3 className="h-8 w-8" />
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-medium mb-2">Bulk Process</h3>
                <p className="text-sm text-muted-foreground">
                  Upload multiple photos at once. Ideal for room inventories.
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Features */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>AI-Powered</span>
            </div>
            <div>•</div>
            <div>Automatic Detection</div>
            <div>•</div>
            <div>Instant Save</div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'quick') {
    return (
      <div className="min-h-screen bg-background">
        {/* Minimal Header */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <h2 className="text-sm font-medium">Quick Capture</h2>
            <div className="text-sm text-muted-foreground">
              {detectedItems.length} items
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Use the capture button to add items</p>
            <p className="text-sm text-muted-foreground">Items are saved automatically</p>
          </div>

          {/* Recent Items */}
          {detectedItems.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-4">Recently Added</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {detectedItems.slice(-6).map((item, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="aspect-square bg-muted rounded mb-2" />
                    <p className="text-sm font-medium truncate">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Capture Button */}
        <QuickCapture onItemsDetected={handleQuickCapture} />
      </div>
    )
  }

  if (mode === 'bulk') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <h2 className="text-sm font-medium">Bulk Process</h2>
            <button
              onClick={() => router.push('/items')}
              className="text-sm font-medium text-primary hover:underline"
              disabled={detectedItems.length === 0}
            >
              Review Items →
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <BulkUpload onComplete={handleBulkComplete} />
          
          {/* Results Summary */}
          {detectedItems.length > 0 && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{detectedItems.length} items detected</p>
                  <p className="text-sm text-muted-foreground">Ready for review</p>
                </div>
                <button
                  onClick={() => router.push('/items')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Review & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
} 