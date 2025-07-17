'use client'

import { useState, useMemo } from 'react'
import { Check, X, Plus, Search, Filter, Grid, List, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu'

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

interface DetectedItemsPanelProps {
  items: DetectedItem[]
  onItemsChange: (items: DetectedItem[]) => void
  onAddToInventory: (selectedItems: DetectedItem[]) => void
  onDeleteItems?: (itemIds: string[]) => void
  className?: string
}

export function DetectedItemsPanel({ items, onItemsChange, onAddToInventory, onDeleteItems }: DetectedItemsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'confidence' | 'label' | 'category'>('confidence')
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category || 'Unknown'))
    return ['all', ...Array.from(cats)]
  }, [items])

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence
        case 'label':
          return a.label.localeCompare(b.label)
        case 'category':
          return (a.category || 'Unknown').localeCompare(b.category || 'Unknown')
        default:
          return 0
      }
    })

    return filtered
  }, [items, searchQuery, selectedCategory, sortBy])

  const selectedItems = items.filter(item => item.selected)
  const allFilteredSelected = filteredAndSortedItems.every(item => item.selected)
  const someFilteredSelected = filteredAndSortedItems.some(item => item.selected)

  const toggleItem = (id: string) => {
    onItemsChange(items.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ))
  }

  const toggleAllFiltered = () => {
    const shouldSelect = !allFilteredSelected
    onItemsChange(items.map(item => {
      if (filteredAndSortedItems.some(filtered => filtered.id === item.id)) {
        return { ...item, selected: shouldSelect }
      }
      return item
    }))
  }

  const deselectAll = () => {
    onItemsChange(items.map(item => ({ ...item, selected: false })))
  }

  const handleAddSelected = () => {
    if (selectedItems.length > 0) {
      onAddToInventory(selectedItems)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length > 0 && onDeleteItems) {
      const selectedIds = selectedItems.map(item => item.id)
      onDeleteItems(selectedIds)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Detected Items [{filteredAndSortedItems.length}/{items.length}]
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1 rounded hover:bg-muted"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                {selectedCategory === 'all' ? 'All' : selectedCategory}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Categories' : category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Sort
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('confidence')}>
                By Confidence
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('label')}>
                By Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('category')}>
                By Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bulk actions */}
        {filteredAndSortedItems.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllFiltered}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                <div className={cn(
                  "w-3 h-3 border rounded flex items-center justify-center",
                  allFilteredSelected ? "bg-blue-500 border-blue-500" : 
                  someFilteredSelected ? "bg-blue-200 border-blue-500" : "border-gray-300"
                )}>
                  {allFilteredSelected && <Check className="h-2 w-2 text-white" />}
                  {someFilteredSelected && !allFilteredSelected && <div className="w-1 h-1 bg-blue-500 rounded" />}
                </div>
                Select All Visible
              </button>
              
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={deselectAll}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                    Clear ({selectedItems.length})
                  </button>
                  {onDeleteItems && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete ({selectedItems.length})
                    </button>
                  )}
                </>
              )}
            </div>
            
            <div className="text-muted-foreground">
              {selectedItems.length} of {items.length} selected
            </div>
          </div>
        )}
      </div>

      {/* Items list/grid */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-2 gap-2" 
            : "space-y-1"
        )}>
          {filteredAndSortedItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 p-2 border rounded-lg transition-colors cursor-pointer",
                item.selected 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
             onClick={() => toggleItem(item.id)}
            >
              <div className={cn(
                  "w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0",
                  item.selected 
                    ? "bg-blue-500 border-blue-500" 
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                {item.selected && <Check className="h-2.5 w-2.5 text-white" />}
              </div>

              {/* Thumbnail */}
              <div className={cn(
                "bg-muted rounded overflow-hidden flex-shrink-0",
                viewMode === 'grid' ? "w-8 h-8" : "w-10 h-10"
              )}>
                {item.croppedImage ? (
                  <img 
                    src={item.croppedImage} 
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {item.category?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  viewMode === 'grid' ? "text-xs" : "text-sm"
                )}>
                  {item.label}
                </p>
                <div className={cn(
                  "flex items-center gap-2 text-muted-foreground",
                  viewMode === 'grid' ? "text-[10px]" : "text-xs"
                )}>
                  <span>{item.category || 'Unknown'}</span>
                  <span>•</span>
                  <span>{Math.round(item.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredAndSortedItems.length === 0 && items.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No items match your search criteria
          </div>
        )}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No items detected yet
          </div>
        )}
      </div>

      {/* Add to inventory button */}
      {selectedItems.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <Button 
            onClick={handleAddSelected}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedItems.length} Selected to Inventory
          </Button>
        </div>
      )}
    </div>
  )
} 