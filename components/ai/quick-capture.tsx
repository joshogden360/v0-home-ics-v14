"use client"

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { aiService } from '@/lib/services/ai-service'
import { cn } from '@/lib/utils'

interface QuickCaptureProps {
  onItemsDetected?: (items: any[]) => void
  className?: string
}

export function QuickCapture({ onItemsDetected, className }: QuickCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = useCallback(async (file: File) => {
    setIsCapturing(false)
    setIsAnalyzing(true)
    
    // Create preview
    const url = URL.createObjectURL(file)
    setPreview(url)

    try {
      const result = await aiService.analyzeImage(file)
      console.log('Quick capture analysis result:', result)
      
      if (result.items && result.items.length > 0) {
        onItemsDetected?.(result.items)
        
        // Auto-clear after success
        setTimeout(() => {
          setPreview(null)
          URL.revokeObjectURL(url)
        }, 2000)
      } else {
        console.warn('No items detected in image')
        // Keep preview visible for longer when no items detected
        setTimeout(() => {
          setPreview(null)
          URL.revokeObjectURL(url)
        }, 4000)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      // Clear preview on error
      setTimeout(() => {
        setPreview(null)
        URL.revokeObjectURL(url)
      }, 3000)
    } finally {
      setIsAnalyzing(false)
    }
  }, [onItemsDetected])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleCapture(file)
  }

  const handleCameraCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleCapture(file)
    }
    input.click()
  }

  if (preview) {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg overflow-hidden",
        "w-72 transition-all duration-200",
        className
      )}>
        <div className="relative">
          <img 
            src={preview} 
            alt="Captured" 
            className="w-full h-48 object-cover"
          />
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {!isAnalyzing && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-500" />
            </div>
          )}
        </div>
        <div className="p-3 text-sm">
          {isAnalyzing ? 'Detecting items...' : 'Analysis complete'}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      className
    )}>
      <div className="flex gap-2">
        {/* Camera Capture */}
        <button
          onClick={handleCameraCapture}
          className={cn(
            "h-14 w-14 rounded-full bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl transition-all",
            "flex items-center justify-center",
            "hover:scale-105 active:scale-95"
          )}
          title="Quick Capture"
        >
          <Camera className="h-6 w-6" />
        </button>

        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "h-14 w-14 rounded-full bg-secondary text-secondary-foreground",
            "shadow-lg hover:shadow-xl transition-all",
            "flex items-center justify-center",
            "hover:scale-105 active:scale-95"
          )}
          title="Upload Image"
        >
          <Upload className="h-6 w-6" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
} 