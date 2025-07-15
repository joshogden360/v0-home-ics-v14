'use client'

import { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Camera, Loader2, AlertCircle, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BoundingBoxEditor } from '@/components/ai/bounding-box-editor'
import { DetectedItemsList } from '@/components/ai/detected-items-list'
import { 
  imagePreviewUrlAtom as uploadedImageAtom, 
  detectedItemsAtom, 
  aiAnalysisLoadingAtom as isAnalyzingAtom,
  aiAnalysisErrorAtom as analysisErrorAtom,
  startAnalysisAtom
} from '@/lib/atoms/ai'
import { Input } from '@/components/ui/input'

export function PhotoToItems() {
  const [uploadedImage, setUploadedImage] = useAtom(uploadedImageAtom)
  const [detectedItems, setDetectedItems] = useAtom(detectedItemsAtom)
  const [isAnalyzing, setIsAnalyzing] = useAtom(isAnalyzingAtom)
  const [analysisError, setAnalysisError] = useAtom(analysisErrorAtom)
  const [, startAnalysis] = useAtom(startAnalysisAtom)
  const [targetPrompt, setTargetPrompt] = useState('household items, furniture, electronics, books, kitchen items, decorative items')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const findItemsButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-trigger analysis when image is uploaded
  useEffect(() => {
    if (uploadedImage && !detectedItems.length && !isAnalyzing && !analysisError) {
      // Auto-trigger object detection after a short delay
      const timer = setTimeout(() => {
        if (findItemsButtonRef.current && !findItemsButtonRef.current.disabled) {
          console.log('Auto-triggering AI analysis...')
          handleAnalyzeImage()
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [uploadedImage])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAnalysisError('Please upload an image file')
        return
      }

      // Reset previous state
      setDetectedItems([])
      setAnalysisError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setUploadedImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result
          if (typeof result === 'string') {
            setUploadedImage(result)
            setDetectedItems([])
            setAnalysisError(null)
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleAnalyzeImage = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setDetectedItems([])

    try {
      // Resize image if needed (max 768px)
      const img = new Image()
      img.src = uploadedImage
      await new Promise((resolve) => { img.onload = resolve })
      
      const maxSize = 768
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      
      let processedImage = uploadedImage
      if (scale < 1) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          processedImage = canvas.toDataURL('image/png', 0.9)
        }
      }

      console.log('Sending request to AI API...')
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: processedImage,
          prompt: targetPrompt
        }),
      })

      const data = await response.json()
      console.log('AI API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      if (data.items && Array.isArray(data.items)) {
        setDetectedItems(data.items)
        console.log(`Detected ${data.items.length} items`)
      } else {
        console.warn('No items detected in response')
        setDetectedItems([])
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAll = () => {
    setUploadedImage(null)
    setDetectedItems([])
    setAnalysisError(null)
    setTargetPrompt('household items, furniture, electronics, books, kitchen items, decorative items')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Items from Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex flex-col gap-2"
                variant="outline"
              >
                <Upload className="h-8 w-8" />
                <span>Upload Photo</span>
              </Button>
              <Button
                onClick={handleCameraCapture}
                className="h-32 flex flex-col gap-2"
                variant="outline"
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search/Prompt Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Describe items to detect (e.g., books, electronics, furniture)"
                  value={targetPrompt}
                  onChange={(e) => setTargetPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnalyzing) {
                      handleAnalyzeImage()
                    }
                  }}
                  disabled={isAnalyzing}
                  className="flex-1"
                />
                <Button
                  ref={findItemsButtonRef}
                  onClick={handleAnalyzeImage}
                  disabled={isAnalyzing}
                  variant={detectedItems.length > 0 ? "default" : "default"}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Items
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetAll}
                  variant="outline"
                >
                  Reset
                </Button>
              </div>

              {/* Status Messages */}
              {isAnalyzing && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    AI is analyzing your image...
                  </AlertDescription>
                </Alert>
              )}

              {analysisError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              {/* Bounding Box Editor */}
              <div ref={containerRef} className="relative">
                <BoundingBoxEditor 
                  containerRef={containerRef}
                  imageUrl={uploadedImage}
                />
              </div>

              {/* Detected Items List */}
              {detectedItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Detected Items ({detectedItems.length})
                  </h3>
                  <DetectedItemsList />
                </div>
              )}

              {!isAnalyzing && !analysisError && detectedItems.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Click "Find Items" to detect objects in your image
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 