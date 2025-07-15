"use client"

import { useCallback, useRef, useState, useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { getStroke } from 'perfect-freehand'
import {
  detectedItemsAtom,
  boundingBoxesAtom,
  selectedDetectedItemsAtom,
  hoveredDetectedItemAtom,
  imageZoomAtom,
  imagePanAtom,
  selectionModeAtom
} from '@/lib/atoms/ai'
import type { BoundingBox, DetectedItem } from '@/lib/services/ai-service'

interface Point {
  x: number
  y: number
  pressure?: number
}

interface BoundingBoxEditorProps {
  containerRef: React.RefObject<HTMLDivElement>
  imageUrl: string
  onBoundingBoxUpdate?: (index: number, box: BoundingBox) => void
  onNewBoundingBox?: (box: BoundingBox) => void
  onItemClick?: (index: number) => void
  editMode?: 'view' | 'edit' | 'draw'
}

export function BoundingBoxEditor({ 
  containerRef, 
  imageUrl,
  onBoundingBoxUpdate,
  onNewBoundingBox,
  onItemClick,
  editMode = 'view'
}: BoundingBoxEditorProps) {
  const [detectedItems, setDetectedItems] = useAtom(detectedItemsAtom)
  const [boundingBoxes, setBoundingBoxes] = useAtom(boundingBoxesAtom)
  const selectedItems = useAtomValue(selectedDetectedItemsAtom)
  const [hoveredItem, setHoveredItem] = useAtom(hoveredDetectedItemAtom)
  const zoom = useAtomValue(imageZoomAtom)
  const pan = useAtomValue(imagePanAtom)
  const selectionMode = useAtomValue(selectionModeAtom)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [dragHandle, setDragHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [originalBox, setOriginalBox] = useState<BoundingBox | null>(null)

  // Get container dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [containerRef])

  // Convert screen coordinates to normalized coordinates
  const screenToNormalized = useCallback((x: number, y: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    
    const rect = containerRef.current.getBoundingClientRect()
    const normalizedX = (x - rect.left) / rect.width
    const normalizedY = (y - rect.top) / rect.height
    
    return {
      x: Math.max(0, Math.min(1, normalizedX)),
      y: Math.max(0, Math.min(1, normalizedY))
    }
  }, [containerRef])

  // Convert normalized coordinates to screen coordinates
  const normalizedToScreen = useCallback((x: number, y: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: x * rect.width + rect.left,
      y: y * rect.height + rect.top
    }
  }, [containerRef])

  // Handle drawing start
  const handleDrawStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (editMode !== 'draw') return
    
    setIsDrawing(true)
    setCurrentPath([])
    
    const point = 'touches' in e ? e.touches[0] : e
    const normalized = screenToNormalized(point.clientX, point.clientY)
    
    setCurrentPath([{
      x: normalized.x * containerSize.width,
      y: normalized.y * containerSize.height,
      pressure: 0.5
    }])
  }, [editMode, screenToNormalized, containerSize])

  // Handle drawing move
  const handleDrawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || editMode !== 'draw') return
    
    const point = 'touches' in e ? e.touches[0] : e
    const normalized = screenToNormalized(point.clientX, point.clientY)
    
    setCurrentPath(prev => [...prev, {
      x: normalized.x * containerSize.width,
      y: normalized.y * containerSize.height,
      pressure: 0.5
    }])
  }, [isDrawing, editMode, screenToNormalized, containerSize])

  // Handle drawing end
  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false)
      setCurrentPath([])
      return
    }
    
    // Convert path to bounding box
    const xs = currentPath.map(p => p.x)
    const ys = currentPath.map(p => p.y)
    
    const minX = Math.min(...xs) / containerSize.width
    const minY = Math.min(...ys) / containerSize.height
    const maxX = Math.max(...xs) / containerSize.width
    const maxY = Math.max(...ys) / containerSize.height
    
    const newBox: BoundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      label: 'New Item'
    }
    
    // Add new bounding box
    if (onNewBoundingBox) {
      onNewBoundingBox(newBox)
    } else {
      // Default behavior: add to detected items
      const newItem: DetectedItem = {
        boundingBox: newBox,
        category: 'Uncategorized',
        description: 'Manually drawn item'
      }
      
      setDetectedItems([...detectedItems, newItem])
      setBoundingBoxes([...boundingBoxes, newBox])
    }
    
    setIsDrawing(false)
    setCurrentPath([])
  }, [isDrawing, currentPath, containerSize, onNewBoundingBox, detectedItems, boundingBoxes, setDetectedItems, setBoundingBoxes])

  // Handle box resize/drag
  const handleBoxMouseDown = useCallback((e: React.MouseEvent, index: number, handle: string) => {
    if (editMode !== 'edit') return
    
    e.stopPropagation()
    setEditingIndex(index)
    setDragHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setOriginalBox({ ...boundingBoxes[index] })
  }, [editMode, boundingBoxes])

  // Handle mouse move for resize/drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart || editingIndex === null || !originalBox) return
    
    const deltaX = (e.clientX - dragStart.x) / containerSize.width
    const deltaY = (e.clientY - dragStart.y) / containerSize.height
    
    const newBox = { ...originalBox }
    
    switch (dragHandle) {
      case 'move':
        newBox.x = Math.max(0, Math.min(1 - newBox.width, originalBox.x + deltaX))
        newBox.y = Math.max(0, Math.min(1 - newBox.height, originalBox.y + deltaY))
        break
      case 'nw':
        newBox.x = Math.max(0, Math.min(originalBox.x + originalBox.width - 0.02, originalBox.x + deltaX))
        newBox.y = Math.max(0, Math.min(originalBox.y + originalBox.height - 0.02, originalBox.y + deltaY))
        newBox.width = originalBox.width - (newBox.x - originalBox.x)
        newBox.height = originalBox.height - (newBox.y - originalBox.y)
        break
      case 'ne':
        newBox.y = Math.max(0, Math.min(originalBox.y + originalBox.height - 0.02, originalBox.y + deltaY))
        newBox.width = Math.max(0.02, Math.min(1 - originalBox.x, originalBox.width + deltaX))
        newBox.height = originalBox.height - (newBox.y - originalBox.y)
        break
      case 'sw':
        newBox.x = Math.max(0, Math.min(originalBox.x + originalBox.width - 0.02, originalBox.x + deltaX))
        newBox.width = originalBox.width - (newBox.x - originalBox.x)
        newBox.height = Math.max(0.02, Math.min(1 - originalBox.y, originalBox.height + deltaY))
        break
      case 'se':
        newBox.width = Math.max(0.02, Math.min(1 - originalBox.x, originalBox.width + deltaX))
        newBox.height = Math.max(0.02, Math.min(1 - originalBox.y, originalBox.height + deltaY))
        break
    }
    
    // Update the box
    const newBoxes = [...boundingBoxes]
    newBoxes[editingIndex] = newBox
    setBoundingBoxes(newBoxes)
    
    // Update detected items
    const newItems = [...detectedItems]
    if (newItems[editingIndex]) {
      newItems[editingIndex].boundingBox = newBox
      setDetectedItems(newItems)
    }
    
    if (onBoundingBoxUpdate) {
      onBoundingBoxUpdate(editingIndex, newBox)
    }
  }, [dragStart, editingIndex, originalBox, dragHandle, containerSize, boundingBoxes, detectedItems, setBoundingBoxes, setDetectedItems, onBoundingBoxUpdate])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setEditingIndex(null)
    setDragHandle(null)
    setDragStart(null)
    setOriginalBox(null)
  }, [])

  // Add global mouse event listeners for drag
  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragStart, handleMouseMove, handleMouseUp])

  // Draw current path
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const rect = containerRef.current.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw current path if drawing
    if (isDrawing && currentPath.length > 1) {
      const stroke = getStroke(currentPath, {
        size: 4,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'
      ctx.beginPath()
      
      stroke.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point[0], point[1])
        } else {
          ctx.lineTo(point[0], point[1])
        }
      })
      
      ctx.closePath()
      ctx.fill()
    }
  }, [currentPath, isDrawing, containerRef])

  if (!containerSize.width || !containerSize.height) return null

  return (
    <div className="absolute inset-0">
      {/* Canvas for drawing */}
      {editMode === 'draw' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-auto cursor-crosshair"
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
          style={{ touchAction: 'none' }}
        />
      )}
      
      {/* Bounding boxes */}
      {boundingBoxes.map((box, index) => {
        const isSelected = selectedItems.includes(index)
        const isHovered = hoveredItem === index
        const isEditing = editingIndex === index
        const item = detectedItems[index]
        
        const boxStyle = {
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.width * 100}%`,
          height: `${box.height * 100}%`,
        }
        
        return (
          <div key={index} className="absolute" style={boxStyle}>
            {/* Main box */}
            <div
              className={`
                absolute inset-0 border-2 transition-all duration-200
                ${editMode === 'edit' ? 'cursor-move' : 'cursor-pointer'}
                ${isSelected 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : isHovered 
                    ? 'border-yellow-400 bg-yellow-400/20' 
                    : 'border-green-400 bg-green-400/10 hover:border-green-500 hover:bg-green-500/20'
                }
                ${isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
              onMouseDown={(e) => editMode === 'edit' && handleBoxMouseDown(e, index, 'move')}
              onClick={() => editMode === 'view' && onItemClick?.(index)}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
            />
            
            {/* Resize handles for edit mode */}
            {editMode === 'edit' && isSelected && (
              <>
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                  onMouseDown={(e) => handleBoxMouseDown(e, index, 'nw')}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                  onMouseDown={(e) => handleBoxMouseDown(e, index, 'ne')}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                  onMouseDown={(e) => handleBoxMouseDown(e, index, 'sw')}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                  onMouseDown={(e) => handleBoxMouseDown(e, index, 'se')}
                />
              </>
            )}
            
            {/* Label */}
            <div className="absolute -top-6 left-0 pointer-events-none">
              <div className={`
                px-2 py-1 text-xs font-medium rounded-md shadow-sm max-w-xs
                ${isSelected 
                  ? 'bg-blue-500 text-white' 
                  : isHovered
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-400 text-white'
                }
              `}>
                {item?.category || box.label || 'Unknown'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 