"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import {
  detectedItemsAtom,
  boundingBoxesAtom,
  selectedDetectedItemsAtom,
  hoveredDetectedItemAtom,
  imageZoomAtom,
  imagePanAtom
} from '@/lib/atoms/ai'

interface BoundingBoxOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  onItemClick?: (index: number) => void
  onItemHover?: (index: number | null) => void
}

export function BoundingBoxOverlay({ 
  containerRef, 
  onItemClick, 
  onItemHover 
}: BoundingBoxOverlayProps) {
  const detectedItems = useAtomValue(detectedItemsAtom)
  const boundingBoxes = useAtomValue(boundingBoxesAtom)
  const selectedItems = useAtomValue(selectedDetectedItemsAtom)
  const hoveredItem = useAtomValue(hoveredDetectedItemAtom)
  const zoom = useAtomValue(imageZoomAtom)
  const pan = useAtomValue(imagePanAtom)
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Update container size on resize
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

  const handleBoxClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onItemClick?.(index)
  }, [onItemClick])

  const handleBoxHover = useCallback((index: number | null) => {
    onItemHover?.(index)
  }, [onItemHover])

  if (!boundingBoxes.length || !containerSize.width || !containerSize.height) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {boundingBoxes.map((box, index) => {
        const isSelected = selectedItems.includes(index)
        const isHovered = hoveredItem === index
        const item = detectedItems[index]

        // Calculate box position and size based on container dimensions and zoom
        const boxStyle = {
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.width * 100}%`,
          height: `${box.height * 100}%`,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left'
        }

        const boxClasses = [
          'absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200',
          isSelected 
            ? 'border-blue-500 bg-blue-500/20' 
            : isHovered 
              ? 'border-yellow-400 bg-yellow-400/20' 
              : 'border-green-400 bg-green-400/10 hover:border-green-500 hover:bg-green-500/20'
        ].join(' ')

        return (
          <div key={index} className="relative">
            {/* Bounding Box */}
            <div
              className={boxClasses}
              style={boxStyle}
              onClick={(e) => handleBoxClick(e, index)}
              onMouseEnter={() => handleBoxHover(index)}
              onMouseLeave={() => handleBoxHover(null)}
            />
            
            {/* Label */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${box.x * 100}%`,
                top: `${Math.max(0, box.y * 100 - 2)}%`,
                transform: `scale(${Math.min(zoom, 1.5)}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'top left'
              }}
            >
              <div className={[
                'px-2 py-1 text-xs font-medium rounded-md shadow-sm max-w-xs',
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : isHovered
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-400 text-white'
              ].join(' ')}>
                <div className="truncate">
                  {item?.category || 'Unknown'}
                </div>
                {item?.boundingBox.label && (
                  <div className="text-xs opacity-90 truncate">
                    {item.boundingBox.label}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${(box.x + box.width) * 100 - 1.5}%`,
                  top: `${box.y * 100}%`,
                  transform: `scale(${Math.min(zoom, 1.5)}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: 'top right'
                }}
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  ✓
                </div>
              </div>
            )}

            {/* Item Index */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                transform: `scale(${Math.min(zoom, 1.5)}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'top left'
              }}
            >
              <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                {index + 1}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 