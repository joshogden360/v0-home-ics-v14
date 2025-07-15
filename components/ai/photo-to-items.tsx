"use client"

import { useCallback, useRef, useState, useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Camera, 
  Zap, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Square,
  MousePointer,
  Grid3X3,
  Pencil,
  Save,
  ArrowRight,
  Package,
  Sparkles,
  Edit3,
  Plus
} from 'lucide-react'
import {
  currentImageAtom,
  imagePreviewUrlAtom,
  aiAnalysisLoadingAtom,
  aiAnalysisErrorAtom,
  aiAnalysisResultAtom,
  detectedItemsAtom,
  boundingBoxesAtom,
  selectedDetectedItemsAtom,
  hoveredDetectedItemAtom,
  selectionModeAtom,
  imageZoomAtom,
  imagePanAtom,
  processingStepAtom,
  hasDetectedItemsAtom,
  selectedItemsCountAtom,
  startAnalysisAtom,
  setAnalysisResultAtom,
  setAnalysisErrorAtom,
  clearAnalysisAtom,
  resetImageViewAtom,
  toggleDetectedItemSelectionAtom,
  zoomInAtom,
  zoomOutAtom
} from '@/lib/atoms/ai'
import { showNotificationAtom } from '@/lib/atoms/atoms'
import { aiService } from '@/lib/services/ai-service'
import { BoundingBoxEditor } from './bounding-box-editor'
import { DetectedItemsList } from './detected-items-list'
import { createItem } from '@/lib/actions/items'
import type { Room } from '@/lib/types'
import type { DetectedItem } from '@/lib/services/ai-service'

interface PhotoToItemsProps {
  rooms?: Room[]
}

export function PhotoToItems({ rooms = [] }: PhotoToItemsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  
  const [currentImage, setCurrentImage] = useAtom(currentImageAtom)
  const [imagePreviewUrl, setImagePreviewUrl] = useAtom(imagePreviewUrlAtom)
  const [isAnalyzing, setIsAnalyzing] = useAtom(aiAnalysisLoadingAtom)
  const [analysisError, setAnalysisError] = useAtom(aiAnalysisErrorAtom)
  const [analysisResult, setAnalysisResult] = useAtom(aiAnalysisResultAtom)
  const detectedItems = useAtomValue(detectedItemsAtom)
  const selectedItems = useAtomValue(selectedDetectedItemsAtom)
  const [selectionMode, setSelectionMode] = useAtom(selectionModeAtom)
  const processingStep = useAtomValue(processingStepAtom)
  const hasDetectedItems = useAtomValue(hasDetectedItemsAtom)
  const selectedItemsCount = useAtomValue(selectedItemsCountAtom)
  const zoom = useAtomValue(imageZoomAtom)
  
  const startAnalysis = useSetAtom(startAnalysisAtom)
  const setResult = useSetAtom(setAnalysisResultAtom)
  const setError = useSetAtom(setAnalysisErrorAtom)
  const clearAnalysis = useSetAtom(clearAnalysisAtom)
  const resetImageView = useSetAtom(resetImageViewAtom)
  const toggleItemSelection = useSetAtom(toggleDetectedItemSelectionAtom)
  const zoomIn = useSetAtom(zoomInAtom)
  const zoomOut = useSetAtom(zoomOutAtom)
  const showNotification = useSetAtom(showNotificationAtom)

  const [editMode, setEditMode] = useState<'view' | 'edit' | 'draw'>('view')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [isAddingItems, setIsAddingItems] = useState(false)
  const [editingItem, setEditingItem] = useState<{ index: number; item: DetectedItem } | null>(null)
  
  // We'll add auto-analyze after handleAnalyze is defined

  const handleFileUpload = useCallback((file: File) => {
    console.log('handleFileUpload called with file:', file.name, file.size, file.type)
    
    if (!file.type.startsWith('image/')) {
      showNotification({
        title: 'Invalid File',
        message: 'Please select an image file',
        type: 'error'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showNotification({
        title: 'File Too Large',
        message: 'Please select an image smaller than 10MB',
        type: 'error'
      })
      return
    }

    console.log('File validation passed, starting analysis...')
    clearAnalysis()
    setCurrentImage(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    
    // Start analysis immediately
    setTimeout(async () => {
      setIsAnalyzing(true)
      setAnalysisError(null)
      
      try {
        console.log('Starting AI analysis for file:', file.name)
        const result = await aiService.analyzeImage(file)
        setResult(result)
        setIsAnalyzing(false)
        
        showNotification({
          title: 'Analysis Complete',
          message: `Found ${result.totalItemsDetected} items in ${(result.processingTime / 1000).toFixed(1)}s`,
          type: 'success'
        })
      } catch (error) {
        console.error('AI Analysis Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setError(errorMessage)
        setIsAnalyzing(false)
        
        showNotification({
          title: 'Analysis Failed',
          message: errorMessage,
          type: 'error'
        })
      }
    }, 100)
  }, [clearAnalysis, setCurrentImage, setImagePreviewUrl, setIsAnalyzing, setAnalysisError, setResult, setError, showNotification])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleAnalyze = useCallback(async () => {
    if (!currentImage) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const result = await aiService.analyzeImage(currentImage)
      setResult(result)
      setIsAnalyzing(false)
      
      showNotification({
        title: 'Analysis Complete',
        message: `Found ${result.totalItemsDetected} items in ${(result.processingTime / 1000).toFixed(1)}s`,
        type: 'success'
      })
    } catch (error) {
      console.error('AI Analysis Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      setIsAnalyzing(false)
      
      showNotification({
        title: 'Analysis Failed',
        message: errorMessage,
        type: 'error'
      })
    }
  }, [currentImage, setResult, setError, showNotification])



  const handleAddSelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) {
      showNotification({
        title: 'No Items Selected',
        message: 'Please select items to add to inventory',
        type: 'warning'
      })
      return
    }

    setIsAddingItems(true)

    try {
      const itemsToAdd = selectedItems.map(index => detectedItems[index])
      let successCount = 0
      
      for (const item of itemsToAdd) {
        try {
          const formData = new FormData()
          formData.append('name', item.boundingBox.label || item.category)
          formData.append('description', item.description)
          formData.append('category', item.category)
          formData.append('condition', item.metadata?.condition || 'Unknown')
          formData.append('notes', `Detected via AI analysis. Additional metadata: ${JSON.stringify(item.metadata || {})}`)
          
          if (selectedRoom) {
            formData.append('room_id', selectedRoom)
          }

          // If we have the current image, add it as media
          if (currentImage) {
            formData.append('photos', currentImage)
          }

          await createItem(formData)
          successCount++
        } catch (error) {
          console.error('Error adding item:', error)
        }
      }

      showNotification({
        title: 'Items Added',
        message: `Successfully added ${successCount} items to inventory`,
        type: 'success'
      })

      // Navigate to items page after successful addition
      if (successCount > 0) {
        router.push('/items')
      }
    } catch (error) {
      console.error('Error adding items:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to add items to inventory',
        type: 'error'
      })
    } finally {
      setIsAddingItems(false)
    }
  }, [selectedItems, detectedItems, selectedRoom, currentImage, showNotification, router])

  const getStepProgress = () => {
    switch (processingStep) {
      case 'upload': return 20
      case 'analyze': return 40
      case 'review': return 60
      case 'save': return 80
      case 'complete': return 100
      default: return 0
    }
  }

  const getStepDescription = () => {
    switch (processingStep) {
      case 'upload': return 'Upload an image to get started'
      case 'analyze': return 'AI is analyzing your image...'
      case 'review': return 'Review and edit detected items'
      case 'save': return 'Adding items to your inventory...'
      case 'complete': return 'All done!'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Photo to Items</CardTitle>
                <CardDescription>{getStepDescription()}</CardDescription>
              </div>
            </div>
            {processingStep !== 'upload' && (
              <Badge variant="outline" className="text-sm">
                Step {processingStep === 'analyze' ? 2 : processingStep === 'review' ? 3 : processingStep === 'save' ? 4 : 5} of 5
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getStepProgress()} className="h-2" />
        </CardContent>
      </Card>

      {/* Image Upload Area */}
      {!currentImage && (
        <Card>
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-primary/25 rounded-lg p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload Room Photo</h3>
                  <p className="text-muted-foreground mb-4">
                    Take a photo of any room or collection of items
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="default" size="lg">
                    <Upload className="h-5 w-5 mr-2" />
                    Choose Photo
                  </Button>
                  <Button variant="outline" size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Analysis Interface */}
      {currentImage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Detection
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Edit Mode Toggle */}
                    {hasDetectedItems && (
                      <div className="flex rounded-md border">
                        <Button
                          variant={editMode === 'view' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setEditMode('view')}
                          className="rounded-r-none"
                        >
                          <MousePointer className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant={editMode === 'edit' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setEditMode('edit')}
                          className="rounded-none border-x"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={editMode === 'draw' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setEditMode('draw')}
                          className="rounded-l-none"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Draw
                        </Button>
                      </div>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 border rounded-md px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => zoomOut()}
                        disabled={zoom <= 0.1}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => zoomIn()}
                        disabled={zoom >= 5}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetImageView()}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Selection Mode */}
                {hasDetectedItems && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Selection:</span>
                    <Button
                      variant={selectionMode === 'single' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectionMode('single')}
                    >
                      Single
                    </Button>
                    <Button
                      variant={selectionMode === 'multi' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectionMode('multi')}
                    >
                      Multiple
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {imagePreviewUrl && (
                    <div
                      ref={imageContainerRef}
                      className="relative overflow-hidden rounded-lg border bg-muted"
                      style={{ height: '600px' }}
                    >
                      <img
                        src={imagePreviewUrl}
                        alt="Uploaded image"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center'
                        }}
                      />
                      
                      {/* Bounding Box Editor */}
                      <BoundingBoxEditor
                        containerRef={imageContainerRef}
                        imageUrl={imagePreviewUrl}
                        editMode={editMode}
                        onItemClick={(index: number) => {
                          toggleItemSelection(index)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {isAnalyzing && (
                    <Button disabled className="flex-1" size="lg">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing Image...
                    </Button>
                  )}

                  {hasDetectedItems && selectedItemsCount > 0 && (
                    <>
                      <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select room (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No room</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.room_id} value={room.room_id.toString()}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={handleAddSelectedItems}
                        disabled={isAddingItems}
                        className="flex-1"
                        size="lg"
                      >
                        {isAddingItems ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Adding Items...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Add {selectedItemsCount} Items to Inventory
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      clearAnalysis()
                      setCurrentImage(null)
                      setImagePreviewUrl(null)
                      setEditMode('view')
                    }}
                  >
                    Start Over
                  </Button>
                </div>

                {/* Error Display */}
                {analysisError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                )}

                {/* Results Summary */}
                {analysisResult && (
                  <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <span className="font-medium">AI Analysis Complete!</span> Detected {analysisResult.totalItemsDetected} items in {(analysisResult.processingTime / 1000).toFixed(1)} seconds.
                      {selectedItemsCount > 0 && (
                        <span className="ml-2">
                          {selectedItemsCount} items selected for inventory.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detected Items Panel */}
          <div className="lg:col-span-1">
            <DetectedItemsList 
              onAddToInventory={async (items) => {
                // Custom handler if needed
                console.log('Adding items:', items)
              }}
            />
          </div>
        </div>
      )}

      {/* Tips Card */}
      {!currentImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Best Practices</h4>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Take photos in good lighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Include multiple items in one shot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Ensure items are clearly visible</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">AI Capabilities</h4>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Detects furniture & electronics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Estimates item conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Provides detailed descriptions</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 