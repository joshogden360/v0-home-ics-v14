"use client"

import { useCallback } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  Circle,
  Eye,
  EyeOff,
  Tag,
  Palette,
  Info
} from 'lucide-react'
import {
  detectedItemsAtom,
  selectedDetectedItemsAtom,
  hoveredDetectedItemAtom,
  selectionModeAtom,
  selectedItemsCountAtom,
  toggleDetectedItemSelectionAtom,
  selectAllDetectedItemsAtom,
  deselectAllDetectedItemsAtom
} from '@/lib/atoms/ai'
import { addItemFromDetection } from '@/lib/actions/items'
import { showNotificationAtom } from '@/lib/atoms/atoms'
import type { DetectedItem } from '@/lib/services/ai-service'

interface DetectedItemsListProps {
  onAddToInventory?: (items: DetectedItem[]) => void
}

export function DetectedItemsList({ onAddToInventory }: DetectedItemsListProps) {
  const detectedItems = useAtomValue(detectedItemsAtom)
  const [selectedItems, setSelectedItems] = useAtom(selectedDetectedItemsAtom)
  const [hoveredItem, setHoveredItem] = useAtom(hoveredDetectedItemAtom)
  const selectionMode = useAtomValue(selectionModeAtom)
  const selectedItemsCount = useAtomValue(selectedItemsCountAtom)
  
  const toggleItemSelection = useSetAtom(toggleDetectedItemSelectionAtom)
  const selectAllItems = useSetAtom(selectAllDetectedItemsAtom)
  const deselectAllItems = useSetAtom(deselectAllDetectedItemsAtom)
  const showNotification = useSetAtom(showNotificationAtom)

  const handleItemClick = useCallback((index: number) => {
    toggleItemSelection(index)
  }, [toggleItemSelection])

  const handleAddSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      showNotification({
        title: 'No Items Selected',
        message: 'Please select items to add to inventory',
        type: 'warning'
      })
      return
    }

    try {
      const itemsToAdd = selectedItems.map(index => detectedItems[index])
      
      if (onAddToInventory) {
        onAddToInventory(itemsToAdd)
      } else {
        // Default behavior: add to inventory using server action
        for (const item of itemsToAdd) {
          await addItemFromDetection(item)
        }
      }

      showNotification({
        title: 'Items Added',
        message: `Successfully added ${selectedItems.length} items to inventory`,
        type: 'success'
      })

      // Clear selection after adding
      deselectAllItems()
    } catch (error) {
      console.error('Error adding items:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to add items to inventory',
        type: 'error'
      })
    }
  }, [selectedItems, detectedItems, onAddToInventory, showNotification, deselectAllItems])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === detectedItems.length) {
      deselectAllItems()
    } else {
      selectAllItems()
    }
  }, [selectedItems.length, detectedItems.length, selectAllItems, deselectAllItems])

  if (detectedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detected Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items detected yet</p>
            <p className="text-sm">Upload an image and analyze to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Detected Items
          <Badge variant="secondary">{detectedItems.length}</Badge>
        </CardTitle>
        
        {/* Bulk Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex-1"
          >
            {selectedItems.length === detectedItems.length ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 mr-2" />
                Select All
              </>
            )}
          </Button>
          
          {selectedItemsCount > 0 && (
            <Button
              onClick={handleAddSelected}
              size="sm"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add ({selectedItemsCount})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-3">
            {detectedItems.map((item, index) => {
              const isSelected = selectedItems.includes(index)
              const isHovered = hoveredItem === index

              return (
                <div
                  key={index}
                  className={[
                    'p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : isHovered
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                  ].join(' ')}
                  onClick={() => handleItemClick(index)}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-3">
                    {selectionMode === 'multi' && (
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => handleItemClick(index)}
                        className="mt-0.5"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          #{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                        )}
                      </div>
                      
                      <h4 className="font-medium truncate mb-1">
                        {item.boundingBox.label}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {item.description}
                      </p>

                      {/* Metadata */}
                      {item.metadata && (
                        <div className="space-y-1">
                          {item.metadata.color && (
                            <div className="flex items-center gap-2 text-xs">
                              <Palette className="h-3 w-3" />
                              <span className="text-muted-foreground">
                                {item.metadata.color}
                              </span>
                            </div>
                          )}
                          
                          {item.metadata.material && (
                            <div className="flex items-center gap-2 text-xs">
                              <Tag className="h-3 w-3" />
                              <span className="text-muted-foreground">
                                {item.metadata.material}
                              </span>
                            </div>
                          )}
                          
                          {item.metadata.condition && (
                            <div className="flex items-center gap-2 text-xs">
                              <Info className="h-3 w-3" />
                              <span className="text-muted-foreground">
                                Condition: {item.metadata.condition}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bounding Box Info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Size: {Math.round(item.boundingBox.width * 100)}% × {Math.round(item.boundingBox.height * 100)}%
                        </span>
                        {item.boundingBox.confidence && (
                          <span>
                            Confidence: {Math.round(item.boundingBox.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setHoveredItem(hoveredItem === index ? null : index)
                        }}
                      >
                        {hoveredItem === index ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {hoveredItem === index ? 'Hide' : 'Highlight'}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            if (onAddToInventory) {
                              onAddToInventory([item])
                            } else {
                              await addItemFromDetection(item)
                            }
                            
                            showNotification({
                              title: 'Item Added',
                              message: 'Successfully added item to inventory',
                              type: 'success'
                            })
                          } catch (error) {
                            showNotification({
                              title: 'Error',
                              message: 'Failed to add item',
                              type: 'error'
                            })
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 