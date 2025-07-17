"use client"

import React, { useEffect, useState, useRef } from 'react'

interface BoundingBox {
  x: number      // Already normalized (0-1)
  y: number      // Already normalized (0-1)
  width: number  // Already normalized (0-1)
  height: number // Already normalized (0-1)
  label: string
}

interface BoundingBoxOverlayProps {
  boundingBoxes: BoundingBox[]
  selectedItems: Set<number>
  onSelectItem: (index: number) => void
  imageElement?: HTMLImageElement | null
  showLabels?: boolean
}

export function BoundingBoxOverlay({
  boundingBoxes,
  selectedItems,
  onSelectItem,
  imageElement,
  showLabels = true
}: BoundingBoxOverlayProps) {
  const [imageDimensions, setImageDimensions] = useState<{
    offsetX: number
    offsetY: number
    displayWidth: number
    displayHeight: number
  } | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imageElement || !containerRef.current) return

    const updateDimensions = () => {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const imageAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight
      const containerAspectRatio = containerWidth / containerHeight

      let displayWidth, displayHeight, offsetX, offsetY

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider - fit to width
        displayWidth = containerWidth
        displayHeight = containerWidth / imageAspectRatio
        offsetX = 0
        offsetY = (containerHeight - displayHeight) / 2
      } else {
        // Image is taller - fit to height
        displayHeight = containerHeight
        displayWidth = containerHeight * imageAspectRatio
        offsetX = (containerWidth - displayWidth) / 2
        offsetY = 0
      }

      setImageDimensions({
        offsetX,
        offsetY,
        displayWidth,
        displayHeight
      })
    }

    updateDimensions()
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [imageElement])

  // Calculate adaptive label sizes and positions
  const getAdaptiveLabelStyle = (box: BoundingBox, index: number) => {
    if (!imageDimensions) return {}
    
    const actualWidth = box.width * imageDimensions.displayWidth
    const actualHeight = box.height * imageDimensions.displayHeight
    const boxArea = actualWidth * actualHeight
    
    // Determine label size based on box size and item density
    const itemDensity = boundingBoxes.length / (imageDimensions.displayWidth * imageDimensions.displayHeight) * 10000
    let fontSize = '11px'
    let padding = '4px 6px'
    
    if (itemDensity > 15 || boxArea < 2000) {
      fontSize = '9px'
      padding = '2px 4px'
    } else if (itemDensity > 8 || boxArea < 5000) {
      fontSize = '10px'
      padding = '3px 5px'
    }
    
    return { fontSize, padding }
  }

  // Smart label positioning to avoid overlaps
  const getLabelPosition = (box: BoundingBox, index: number) => {
    if (!imageDimensions) return { top: '-24px', left: '0px' }
    
    const actualX = imageDimensions.offsetX + (box.x * imageDimensions.displayWidth)
    const actualY = imageDimensions.offsetY + (box.y * imageDimensions.displayHeight)
    const actualWidth = box.width * imageDimensions.displayWidth
    
    // Check for nearby boxes that might cause label overlap
    const hasTopOverlap = boundingBoxes.some((otherBox, otherIndex) => {
      if (otherIndex === index) return false
      const otherY = imageDimensions.offsetY + (otherBox.y * imageDimensions.displayHeight)
      const otherX = imageDimensions.offsetX + (otherBox.x * imageDimensions.displayWidth)
      const otherWidth = otherBox.width * imageDimensions.displayWidth
      
      // Check if labels would overlap vertically and horizontally
      return Math.abs(actualY - otherY) < 30 && 
             Math.abs(actualX - otherX) < Math.max(actualWidth, otherWidth)
    })
    
    // Position label inside box if there's overlap above, or if box is near top
    if (hasTopOverlap || actualY < 30) {
      return { 
        top: '4px', 
        left: '4px',
        maxWidth: `${actualWidth - 8}px`
      }
    }
    
    return { top: '-24px', left: '0px' }
  }

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {imageDimensions && boundingBoxes.map((box, index) => {
        const isSelected = selectedItems.has(index)
        const isHovered = hoveredIndex === index
        
        // Calculate actual position based on image dimensions
        const actualX = imageDimensions.offsetX + (box.x * imageDimensions.displayWidth)
        const actualY = imageDimensions.offsetY + (box.y * imageDimensions.displayHeight)
        const actualWidth = box.width * imageDimensions.displayWidth
        const actualHeight = box.height * imageDimensions.displayHeight
        
        const adaptiveStyle = getAdaptiveLabelStyle(box, index)
        const labelPosition = getLabelPosition(box, index)
        
        return (
          <div
            key={index}
            className={`absolute border-2 cursor-pointer transition-all duration-200 pointer-events-auto group ${
              isSelected ? 'z-20' : isHovered ? 'z-10' : 'z-0'
            }`}
            style={{
              left: `${actualX}px`,
              top: `${actualY}px`,
              width: `${actualWidth}px`,
              height: `${actualHeight}px`,
              borderColor: isSelected ? '#3b82f6' : isHovered ? '#f59e0b' : '#ef4444',
              borderStyle: isSelected ? 'solid' : 'dashed',
              backgroundColor: isSelected 
                ? 'rgba(59, 130, 246, 0.15)' 
                : isHovered 
                  ? 'rgba(245, 158, 11, 0.1)' 
                  : 'rgba(239, 68, 68, 0.05)',
              borderWidth: isSelected ? '2px' : '1px'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onSelectItem(index)
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Label with adaptive positioning and sizing */}
            {showLabels && (
              <div 
                className={`absolute font-medium rounded shadow-sm transition-all duration-200 ${
                  labelPosition.maxWidth ? 'truncate' : 'whitespace-nowrap'
                } ${
                  isSelected || isHovered ? 'opacity-100 scale-100' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
                }`}
                style={{
                  backgroundColor: isSelected 
                    ? '#3b82f6' 
                    : isHovered 
                      ? '#f59e0b' 
                      : '#ef4444',
                  color: 'white',
                  ...adaptiveStyle,
                  ...labelPosition
                }}
              >
                {box.label}
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
            )}
            
            {/* Hover indicator for better visibility */}
            {isHovered && !isSelected && (
              <div className="absolute inset-0 border-2 border-amber-400 rounded animate-pulse" />
            )}
          </div>
        )
      })}
      
      {/* Item count indicator */}
      {boundingBoxes.length > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {boundingBoxes.length} items
        </div>
      )}
    </div>
  )
} 