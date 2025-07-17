'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Move, Search, Grid, Upload, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BoundingBoxOverlay } from './bounding-box-overlay'
import { useAtom, useSetAtom } from 'jotai'
import { 
  detectedItemsAtom, 
  hoveredDetectedItemAtom, 
  toggleDetectedItemSelectionAtom,
  imageZoomAtom,
  imagePanAtom,
  selectedDetectedItemsAtom,
  boundingBoxesAtom
} from '@/lib/atoms/ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface FileViewerProps {
  files: File[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onAnalyze: (file: File, prompt?: string) => void
  onUploadFiles?: (files: File[]) => void
  onClearFiles?: () => void
  onClearDetectedItems?: () => void
  className?: string
}

export function FileViewer({ 
  files, 
  currentIndex, 
  onIndexChange, 
  onAnalyze,
  onUploadFiles,
  onClearFiles,
  onClearDetectedItems,
  className 
}: FileViewerProps) {
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [detectedItems] = useAtom(detectedItemsAtom)
  const [boundingBoxes] = useAtom(boundingBoxesAtom)
  const [selectedItems] = useAtom(selectedDetectedItemsAtom)
  const [zoom, setZoom] = useAtom(imageZoomAtom)
  const [pan, setPan] = useAtom(imagePanAtom)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [userPrompt, setUserPrompt] = useState('household items, furniture, electronics, decor, utilities')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const imgElementRef = useRef<HTMLImageElement>(null)
  
  const setHoveredItem = useSetAtom(hoveredDetectedItemAtom)
  const toggleItemSelection = useSetAtom(toggleDetectedItemSelectionAtom)

  // Generate URL for current file if not already cached
  useEffect(() => {
    if (files[currentIndex] && !imageUrls[currentIndex]) {
      const url = URL.createObjectURL(files[currentIndex])
      setImageUrls(prev => ({ ...prev, [currentIndex]: url }))
    }
  }, [files, currentIndex, imageUrls])

  const currentFile = files[currentIndex]
  const currentUrl = imageUrls[currentIndex]

  const handleAnalyze = () => {
    onAnalyze(currentFile, userPrompt)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
      // Reset zoom and pan when changing images
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      onIndexChange(currentIndex + 1)
      // Reset zoom and pan when changing images
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey || zoom > 1)) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || [])
    if (uploadedFiles.length > 0 && onUploadFiles) {
      onUploadFiles(uploadedFiles)
    }
    // Reset input value to allow selecting the same files again
    e.target.value = ''
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  if (!currentFile) {
    return (
      <div className={cn("border rounded-lg p-8 text-center", className)}>
        <p className="text-muted-foreground">No files uploaded</p>
      </div>
    )
  }

  // Define carousel colors
  const carouselColors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA']

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header with title */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">File Viewer</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleUploadClick}
              className="p-1 rounded hover:bg-muted flex items-center gap-1 text-xs px-2"
              title="Upload more images"
            >
              <Upload className="h-3 w-3" />
              Add Images
            </button>
            {files.length > 0 && onClearFiles && (
              <button
                onClick={onClearFiles}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs px-2"
                title="Clear all files"
              >
                <Trash2 className="h-3 w-3" />
                Clear Files
              </button>
            )}
            {detectedItems.length > 0 && onClearDetectedItems && (
              <button
                onClick={onClearDetectedItems}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs px-2"
                title="Clear detected items"
              >
                <RotateCcw className="h-3 w-3" />
                Clear Detection
              </button>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Main viewer with controls */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Zoom controls */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-muted"
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-xs text-muted-foreground min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-muted"
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 rounded hover:bg-muted ml-1"
              title="Reset view"
            >
              <Move className="h-3 w-3" />
            </button>
            {detectedItems.length > 0 && (
              <>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={cn(
                    "p-1 rounded hover:bg-muted ml-1",
                    showGrid && "bg-muted"
                  )}
                  title="Toggle grid"
                >
                  <Grid className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={cn(
                    "p-1 rounded hover:bg-muted ml-1",
                    showLabels && "bg-muted"
                  )}
                  title={showLabels ? "Hide labels" : "Show labels"}
                >
                  <span className="text-xs font-mono">AB</span>
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {detectedItems.length > 0 && `${detectedItems.length} items detected`}
          </p>
        </div>

        {/* Image viewer - adjusted for laptop screens */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <div 
              ref={containerRef}
              className="relative w-full h-full rounded-lg overflow-hidden bg-muted/10"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {currentUrl && (
                <>
                  {/* Image with bounding boxes */}
                  <div
                    ref={imageRef}
                    className="absolute inset-0"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.2s',
                      cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default'
                    }}
                  >
                    <div className="relative w-full h-full">
                      <img
                        ref={imgElementRef}
                        src={currentUrl}
                        alt={currentFile.name}
                        className="absolute inset-0 w-full h-full object-contain"
                        draggable={false}
                      />
                      
                      {/* Bounding boxes overlay */}
                      {detectedItems.length > 0 && (
                        <BoundingBoxOverlay
                          boundingBoxes={boundingBoxes}
                          selectedItems={new Set(selectedItems)}
                          onSelectItem={toggleItemSelection}
                          imageElement={imgElementRef.current}
                          showLabels={showLabels}
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User prompt area */}
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Specify what items to look for..."
                className="flex-1 h-16 text-xs resize-none"
              />
              <div className="flex flex-col gap-1">
                <Button
                  onClick={handleAnalyze}
                  className="bg-white text-black hover:bg-gray-100 border h-7 text-xs px-3"
                  size="sm"
                >
                  Analyze
                </Button>
                <select 
                  className="h-7 text-xs border rounded px-2"
                  onChange={(e) => setUserPrompt(e.target.value)}
                  value=""
                >
                  <option value="" disabled>Presets</option>
                  <option value="household items, furniture, electronics, decor, utilities">All Items</option>
                  <option value="furniture, chairs, tables, desks, shelves, cabinets">Furniture</option>
                  <option value="electronics, computers, monitors, phones, tablets, cables">Electronics</option>
                  <option value="decor, artwork, photos, plants, ornaments">Decor</option>
                  <option value="kitchen items, appliances, cookware, utensils">Kitchen</option>
                  <option value="utilities, switches, outlets, fixtures">Utilities</option>
                </select>
              </div>
            </div>
          </div>

          {/* File info */}
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">{currentFile.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB • Image {currentIndex + 1} of {files.length}
              </p>
            </div>
          </div>

          {/* File carousel - compact version */}
          {files.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <h3 className="text-xs font-medium mb-1">File Carousel</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {files.map((file, index) => {
                  const url = imageUrls[index] || URL.createObjectURL(file)
                  if (!imageUrls[index]) {
                    setImageUrls(prev => ({ ...prev, [index]: url }))
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        onIndexChange(index)
                        setZoom(1)
                        setPan({ x: 0, y: 0 })
                      }}
                      className={cn(
                        "relative flex-shrink-0 rounded-md overflow-hidden transition-all",
                        "hover:scale-105 group",
                        currentIndex === index 
                          ? "ring-2 ring-offset-1 ring-blue-500" 
                          : ""
                      )}
                      style={{
                        backgroundColor: carouselColors[index % carouselColors.length],
                        width: '50px',
                        height: '50px'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded overflow-hidden">
                          <img
                            src={url}
                            alt={`${file.name} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] p-0.5 text-center">
                        {index + 1}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 