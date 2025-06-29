"use client"

import { useCallback, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Grid3X3
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
import { aiService } from '@/lib/services/ai-service'
import { BoundingBoxOverlay } from './bounding-box-overlay'
import { DetectedItemsList } from './detected-items-list'
import { showNotificationAtom } from '@/lib/atoms/atoms'

interface ImageAnalyzerProps {
  onItemsDetected?: (items: any[]) => void
  onItemSelected?: (item: any) => void
}

export function ImageAnalyzer({ onItemsDetected, onItemSelected }: ImageAnalyzerProps) {
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

  const handleFileUpload = useCallback((file: File) => {
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

    clearAnalysis()
    startAnalysis(file)
  }, [clearAnalysis, startAnalysis, showNotification])

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
      
      if (onItemsDetected) {
        onItemsDetected(result.items)
      }

      showNotification({
        title: 'Analysis Complete',
        message: `Found ${result.totalItemsDetected} items in ${(result.processingTime / 1000).toFixed(1)}s`,
        type: 'success'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      
      showNotification({
        title: 'Analysis Failed',
        message: errorMessage,
        type: 'error'
      })
    }
  }, [currentImage, setResult, setError, onItemsDetected, showNotification])

  const getStepProgress = () => {
    switch (processingStep) {
      case 'upload': return 25
      case 'analyze': return 50
      case 'review': return 75
      case 'save': return 90
      case 'complete': return 100
      default: return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Image Analysis
          </CardTitle>
          <CardDescription>
            Upload an image to automatically detect and catalog household items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{processingStep.charAt(0).toUpperCase() + processingStep.slice(1)}</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Image Upload Area */}
      {!currentImage && (
        <Card>
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload an Image</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop an image here, or click to browse
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Supports JPG, PNG, WebP up to 10MB
              </p>
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

      {/* Image Analysis Interface */}
      {currentImage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Image Analysis</CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => zoomOut()}
                      disabled={zoom <= 0.1}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => zoomIn()}
                      disabled={zoom >= 5}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetImageView()}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Selection Mode Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Selection mode:</span>
                  <div className="flex rounded-md border">
                    <Button
                      variant={selectionMode === 'single' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectionMode('single')}
                      className="rounded-r-none"
                    >
                      <MousePointer className="h-4 w-4 mr-1" />
                      Single
                    </Button>
                    <Button
                      variant={selectionMode === 'multi' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectionMode('multi')}
                      className="rounded-none border-x"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Multi
                    </Button>
                    <Button
                      variant={selectionMode === 'crop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectionMode('crop')}
                      className="rounded-l-none"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Crop
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {imagePreviewUrl && (
                    <div
                      ref={imageContainerRef}
                      className="relative overflow-hidden rounded-lg border bg-muted"
                      style={{ height: '500px' }}
                    >
                      <img
                        src={imagePreviewUrl}
                        alt="Uploaded image"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center'
                        }}
                      />
                      
                      {/* Bounding Box Overlay */}
                      {hasDetectedItems && (
                        <BoundingBoxOverlay
                          containerRef={imageContainerRef}
                          onItemClick={(index: number) => {
                            toggleItemSelection(index)
                            if (onItemSelected && detectedItems[index]) {
                              onItemSelected(detectedItems[index])
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Analysis Actions */}
                <div className="flex gap-2 mt-4">
                  {!hasDetectedItems && !isAnalyzing && (
                    <Button 
                      onClick={handleAnalyze}
                      disabled={!aiService.isAvailable()}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Image
                    </Button>
                  )}
                  
                  {isAnalyzing && (
                    <Button disabled className="flex-1">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      clearAnalysis()
                      setCurrentImage(null)
                      setImagePreviewUrl(null)
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
                  <Alert className="mt-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Detected {analysisResult.totalItemsDetected} items in {(analysisResult.processingTime / 1000).toFixed(1)} seconds
                      {selectedItemsCount > 0 && (
                        <span className="ml-2">
                          • {selectedItemsCount} selected
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
            <DetectedItemsList />
          </div>
        </div>
      )}

      {/* AI Service Status */}
      {!aiService.isAvailable() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI features are not available. Please check your Google AI API key configuration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 