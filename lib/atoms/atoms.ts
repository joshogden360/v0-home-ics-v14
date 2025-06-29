import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Item, Room, Tag, Maintenance, Document } from '@/lib/types'

// ============= UI State Atoms =============
// Global UI state
export const sidebarOpenAtom = atomWithStorage('sidebarOpen', true)
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system')
export const leftPanelExpandedAtom = atomWithStorage('leftPanelExpanded', true)
export const rightPanelExpandedAtom = atomWithStorage('rightPanelExpanded', false)

// Loading and status atoms
export const isLoadingAtom = atom(false)
export const uploadProgressAtom = atom(0)
export const processingStatusAtom = atom<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle')

// Search and filter atoms
export const searchQueryAtom = atom('')
export const activeFiltersAtom = atom({
  category: '',
  room: '',
  condition: '',
  priceRange: [0, 10000] as [number, number],
  hasWarranty: false,
  hasInsurance: false,
  needsMaintenance: false
})

// Selection atoms
export const selectedItemsAtom = atom<number[]>([])
export const selectedRoomsAtom = atom<number[]>([])
export const selectionModeAtom = atom<'single' | 'multi'>('single')

// View preferences
export const viewModeAtom = atomWithStorage<'grid' | 'list'>('viewMode', 'list')
export const sortByAtom = atom<'name' | 'date' | 'price' | 'category'>('name')
export const sortOrderAtom = atom<'asc' | 'desc'>('asc')

// ============= Data Cache Atoms =============
// Main data collections
export const itemsAtom = atom<Item[]>([])
export const roomsAtom = atom<Room[]>([])
export const tagsAtom = atom<Tag[]>([])
export const maintenanceTasksAtom = atom<Maintenance[]>([])
export const documentsAtom = atom<Document[]>([])

// Derived atoms for filtered data
export const filteredItemsAtom = atom((get) => {
  const items = get(itemsAtom)
  const query = get(searchQueryAtom).toLowerCase()
  const filters = get(activeFiltersAtom)
  
  return items.filter(item => {
    // Search query
    if (query && !item.name.toLowerCase().includes(query) && 
        !item.description?.toLowerCase().includes(query)) {
      return false
    }
    
    // Category filter
    if (filters.category && item.category !== filters.category) {
      return false
    }
    
    // Room filter
    if (filters.room && item.room?.room_id.toString() !== filters.room) {
      return false
    }
    
    // Condition filter
    if (filters.condition && item.condition !== filters.condition) {
      return false
    }
    
    // Price range filter
    if (item.purchase_price !== null && 
        (item.purchase_price < filters.priceRange[0] || 
         item.purchase_price > filters.priceRange[1])) {
      return false
    }
    
    return true
  })
})

// ============= Form State Atoms =============
// Item form state
export const itemFormAtom = atom({
  isSubmitting: false,
  error: null as string | null,
  activeTab: 'basic',
  formData: {
    name: '',
    description: '',
    category: '',
    condition: '',
    purchased_from: '',
    serial_number: '',
    warranty_provider: '',
    storage_location: '',
    notes: '',
    room_id: ''
  },
  selectedDate: undefined as Date | undefined,
  selectedWarrantyDate: undefined as Date | undefined,
  purchasePrice: 0,
  currentValue: 0,
  hasInsurance: false,
  needsMaintenance: false,
  maintenanceInterval: 90
})

// Room form state
export const roomFormAtom = atom({
  isSubmitting: false,
  error: null as string | null,
  activeTab: 'basic',
  formData: {
    name: '',
    description: '',
    floor_number: '1',
    area_sqft: ''
  },
  selectedItems: [] as number[]
})

// Maintenance form state
export const maintenanceFormAtom = atom({
  isSubmitting: false,
  error: null as string | null,
  selectedItem: null as number | null,
  maintenanceType: '',
  frequencyDays: 90,
  lastPerformed: undefined as Date | undefined,
  instructions: ''
})

// ============= Media Upload Atoms =============
export const uploadQueueAtom = atom<File[]>([])
export const uploadedFilesAtom = atom<{
  photos: File[],
  documents: File[]
}>({
  photos: [],
  documents: []
})
export const photoPreviewUrlsAtom = atom<string[]>([])
export const documentPreviewNamesAtom = atom<string[]>([])

// ============= Dashboard Stats Atoms =============
export const dashboardStatsAtom = atom({
  counts: {
    items: 0,
    rooms: 0,
    media: 0,
    maintenance: 0
  },
  recentItems: [] as Item[],
  upcomingMaintenance: [] as Maintenance[],
  itemsByCategory: [] as { category: string; count: number }[],
  itemsByRoom: [] as { room_name: string; count: number }[]
})

// ============= Modal/Dialog State Atoms =============
export const deleteConfirmAtom = atom({
  isOpen: false,
  itemId: null as number | null,
  itemName: ''
})

export const mediaModalAtom = atom({
  isOpen: false,
  mediaUrl: '',
  mediaType: ''
})

// ============= Toast/Notification Atoms =============
export const notificationAtom = atom({
  show: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error' | 'warning' | 'info'
})

// ============= Utility Atoms =============
// Bump session to trigger re-fetching
export const bumpSessionAtom = atom(0)

// Init finished flag
export const initFinishedAtom = atom(false)

// Current active page/route
export const currentPageAtom = atom('')

// Hover states
export const hoveredItemAtom = atom<number | null>(null)
export const hoveredRoomAtom = atom<number | null>(null)

// ============= Derived Atoms =============
// Total value of all items
export const totalInventoryValueAtom = atom((get) => {
  const items = get(itemsAtom)
  return items.reduce((total, item) => {
    return total + (item.current_value || item.purchase_price || 0)
  }, 0)
})

// Items needing maintenance
export const itemsNeedingMaintenanceAtom = atom((get) => {
  const items = get(itemsAtom)
  return items.filter(item => item.needs_maintenance)
})

// Items by room
export const itemsByRoomAtom = atom((get) => {
  const items = get(itemsAtom)
  const rooms = get(roomsAtom)
  
  return rooms.map(room => ({
    room,
    items: items.filter(item => item.room?.room_id === room.room_id)
  }))
})

// Unassigned items (no room)
export const unassignedItemsAtom = atom((get) => {
  const items = get(itemsAtom)
  return items.filter(item => !item.room)
})

// Categories list
export const categoriesAtom = atom((get) => {
  const items = get(itemsAtom)
  const categories = new Set(items.map(item => item.category).filter(Boolean))
  return Array.from(categories).sort()
})

// ============= Action Atoms =============
// Reset all filters
export const resetFiltersAtom = atom(null, (get, set) => {
  set(searchQueryAtom, '')
  set(activeFiltersAtom, {
    category: '',
    room: '',
    condition: '',
    priceRange: [0, 10000],
    hasWarranty: false,
    hasInsurance: false,
    needsMaintenance: false
  })
  set(selectedItemsAtom, [])
})

// Clear form data
export const clearItemFormAtom = atom(null, (get, set) => {
  set(itemFormAtom, {
    isSubmitting: false,
    error: null,
    activeTab: 'basic',
    formData: {
      name: '',
      description: '',
      category: '',
      condition: '',
      purchased_from: '',
      serial_number: '',
      warranty_provider: '',
      storage_location: '',
      notes: '',
      room_id: ''
    },
    selectedDate: undefined,
    selectedWarrantyDate: undefined,
    purchasePrice: 0,
    currentValue: 0,
    hasInsurance: false,
    needsMaintenance: false,
    maintenanceInterval: 90
  })
  set(uploadedFilesAtom, { photos: [], documents: [] })
  set(photoPreviewUrlsAtom, [])
  set(documentPreviewNamesAtom, [])
})

// Show notification
export const showNotificationAtom = atom(
  null,
  (get, set, { title, message, type }: { title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
    set(notificationAtom, { show: true, title, message, type })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      set(notificationAtom, prev => ({ ...prev, show: false }))
    }, 5000)
  }
) 