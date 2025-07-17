'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileViewer } from './file-viewer'
import { DetectedItemsPanel } from './detected-items-panel'
import { aiService } from '@/lib/services/ai-service'
import { createItem } from '@/lib/actions/items'
import { useToast } from '@/components/ui/use-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSetAtom } from 'jotai'
import { detectedItemsAtom, boundingBoxesAtom } from '@/lib/atoms/ai'

interface DetectedItem {
  id: string
  label: string
  description?: string
  category?: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
    label?: string
  }
  croppedImage?: string
  selected: boolean
}

interface InventoryItem {
  id: string
  name: string
  image?: string
  timestamp: Date
}

export function PhotoToItemsWorkflow() {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [originalAnalysisResult, setOriginalAnalysisResult] = useState<any>(null)
  
  const setDetectedItemsAtom = useSetAtom(detectedItemsAtom)
  const setBoundingBoxesAtom = useSetAtom(boundingBoxesAtom)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...uploadedFiles])
  }

  const handleUploadFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleClearFiles = () => {
    if (confirm('Are you sure you want to clear all files? This will remove all uploaded images and detected items.')) {
      setFiles([])
      setCurrentFileIndex(0)
      setDetectedItems([])
      setDetectedItemsAtom([])
      setBoundingBoxesAtom([])
    }
  }

  const handleClearDetectedItems = () => {
    if (confirm('Are you sure you want to clear all detected items? You will need to re-analyze images to detect items again.')) {
      setDetectedItems([])
      setDetectedItemsAtom([])
      setBoundingBoxesAtom([])
    }
  }

  const handleDeleteItems = (itemIds: string[]) => {
    const itemCount = itemIds.length
    if (confirm(`Are you sure you want to delete ${itemCount} selected item${itemCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      const remainingItems = detectedItems.filter(item => !itemIds.includes(item.id))
      setDetectedItems(remainingItems)
      
      // Update atoms with remaining original items
      if (originalAnalysisResult && originalAnalysisResult.items) {
        const remainingIndices = remainingItems.map(item => {
          const idParts = item.id.split('-')
          return parseInt(idParts[idParts.length - 1])
        })
        
        const remainingOriginalItems = originalAnalysisResult.items.filter((_: any, index: number) => 
          remainingIndices.includes(index)
        )
        
        setDetectedItemsAtom(remainingOriginalItems)
        setBoundingBoxesAtom(remainingOriginalItems.map((item: any) => item.boundingBox))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const transformCoordinates = (items: any[]) => {
    // Gemini returns coordinates in 0-1000 range that are already converted to 0-1 by our API
    // This function is no longer needed but kept for compatibility
    return items.map(item => {
      // The API already converts coordinates to 0-1 range
      if (item.boundingBox) {
        return item
      } else if (item.box_2d) {
        // Legacy format handling
        const [ymin, xmin, ymax, xmax] = item.box_2d
        return {
          boundingBox: {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: item.label
          },
          label: item.label,
          confidence: item.confidence || 0.95
        }
      } else {
        // Fallback for items without bounding boxes
        return {
          boundingBox: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            label: item.label || 'Unknown'
          },
          label: item.label || 'Unknown',
          confidence: item.confidence || 0.95
        }
      }
    })
  }

  const handleAnalyze = async (file: File, userPrompt?: string) => {
    setIsAnalyzing(true)
    // Clear previous results when analyzing a new image
    setDetectedItems([])
    setDetectedItemsAtom([])
    setBoundingBoxesAtom([])
    
    try {
      const result = await aiService.analyzeImage(file, userPrompt)
      
      if (result.items && result.items.length > 0) {
        // Create data URL for cropping
        const reader = new FileReader()
        reader.onload = async (e) => {
          if (e.target?.result) {
            const imageUrl = e.target.result as string
            
            // Process detected items with cropped images
            const processedItems = await Promise.all(
              result.items.map(async (item: any, index: number) => {
                const croppedImage = await cropItemImage(item.boundingBox, imageUrl)
                return {
                  id: `${Date.now()}-${index}`,
                  label: item.boundingBox?.label || item.description || 'Unknown item',
                  description: item.description,
                  category: item.category,
                  confidence: item.boundingBox.confidence || 0.95,
                  boundingBox: item.boundingBox,
                  croppedImage,
                  selected: true // Default to selected
                }
              })
            )
            
            setDetectedItems(processedItems)
            setOriginalAnalysisResult(result)
            
            // Debug logging
            console.log('AI Analysis Result:', {
              items: result.items,
              boundingBoxes: result.items.map((item: any) => item.boundingBox)
            })
            
            // Update atoms for bounding box display
            setDetectedItemsAtom(result.items)
            setBoundingBoxesAtom(result.items.map((item: any) => item.boundingBox))
            
            toast({
              title: "Analysis complete",
              description: `Found ${processedItems.length} items in the image`
            })
          }
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          title: "No items detected",
          description: "Try a different image or adjust the angle",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const cropItemImage = async (boundingBox: any, imageSrc: string): Promise<string | undefined> => {
    if (!imageSrc || !boundingBox) return undefined
    
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(undefined)
          return
        }
        
        const cropX = Math.round(boundingBox.x * img.width)
        const cropY = Math.round(boundingBox.y * img.height)
        const cropWidth = Math.round(boundingBox.width * img.width)
        const cropHeight = Math.round(boundingBox.height * img.height)
        
        canvas.width = cropWidth
        canvas.height = cropHeight
        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        )
        
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      img.onerror = () => resolve(undefined)
      img.src = imageSrc
    })
  }

  const handleAddToInventory = async (selectedItems: DetectedItem[]) => {
    setIsSaving(true)
    
    try {
      for (const item of selectedItems) {
        const formData = new FormData()
        formData.append('name', item.label)
        formData.append('description', item.description || `AI detected: ${item.label}`)
        formData.append('category', item.category || 'Uncategorized')
        formData.append('condition', 'Unknown')
        formData.append('notes', 'Added via AI detection')
        
        // Add cropped image if available
        if (item.croppedImage) {
          const response = await fetch(item.croppedImage)
          const blob = await response.blob()
          const file = new File([blob], `${item.label.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' })
          formData.append('photos', file)
        }
        
        const result = await createItem(formData)
        
        if (result.success && result.id) {
          setInventoryItems(prev => [...prev, {
            id: result.id,
            name: item.label,
            image: item.croppedImage,
            timestamp: new Date()
          }])
        }
      }
      
      // Remove saved items from detected items
      const savedIds = selectedItems.map(item => item.id)
      const remainingItems = detectedItems.filter(item => !savedIds.includes(item.id))
      
      setDetectedItems(remainingItems)
      
      // Update atoms using the stored original analysis result
      if (originalAnalysisResult && originalAnalysisResult.items) {
        // Map remaining items back to their original indices
        const remainingIndices = remainingItems.map(item => {
          const idParts = item.id.split('-')
          return parseInt(idParts[idParts.length - 1])
        })
        
        const remainingOriginalItems = originalAnalysisResult.items.filter((_: any, index: number) => 
          remainingIndices.includes(index)
        )
        
        setDetectedItemsAtom(remainingOriginalItems)
        setBoundingBoxesAtom(remainingOriginalItems.map((item: any) => item.boundingBox))
      }
      
      toast({
        title: "Items added",
        description: `Successfully added ${selectedItems.length} items to inventory`
      })
    } catch (error) {
      console.error('Error saving items:', error)
      toast({
        title: "Save failed",
        description: "Some items could not be saved",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col"> {/* Changed to use full height available */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-3 flex-1 min-h-0"> {/* Added flex-1 and min-h-0 */}
        {/* File Viewer Panel - Adjusted ratio */}
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden"> {/* Added overflow-hidden */}
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center p-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="w-full max-w-sm border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors"
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-2 text-sm">Drop images here or</p>
                <label className="cursor-pointer">
                  <span className="text-primary hover:underline text-sm">browse files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="h-full p-3"> {/* Reduced padding */}
              <FileViewer
                files={files}
                currentIndex={currentFileIndex}
                onIndexChange={setCurrentFileIndex}
                onAnalyze={handleAnalyze}
                onUploadFiles={handleUploadFiles}
                onClearFiles={handleClearFiles}
                onClearDetectedItems={handleClearDetectedItems}
              />
            </div>
          )}
        </div>

        {/* Right column - Stacked panels */}
        <div className="flex flex-col gap-3 min-h-0"> {/* Added min-h-0 */}
          {/* Detected Items Panel */}
          <div className="border rounded-lg bg-card shadow-sm p-3 flex-1 min-h-0 overflow-hidden">
            {isAnalyzing ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Analyzing image...</p>
                </div>
              </div>
            ) : detectedItems.length > 0 ? (
              <DetectedItemsPanel
                items={detectedItems}
                onItemsChange={setDetectedItems}
                onAddToInventory={handleAddToInventory}
                onDeleteItems={handleDeleteItems}
              />
            ) : (
              <div className="h-full flex flex-col">
                <h2 className="text-base font-semibold mb-2">Detected Items [0]</h2>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground text-center text-sm">
                    Upload and analyze images to detect items
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items Inventory Panel */}
          <div className="border rounded-lg bg-card shadow-sm p-3 flex-1 min-h-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <h2 className="text-base font-semibold mb-2">Items Inventory</h2>
              
              {inventoryItems.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-2">
                    {inventoryItems.length} items added to inventory
                  </p>
                  <div className="space-y-2">
                    {inventoryItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                        {item.image && (
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {inventoryItems.length > 3 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/items')}
                      className="w-full mt-2 h-7 text-xs"
                    >
                      View All Items
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground text-center text-sm">
                    Items added to inventory will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 