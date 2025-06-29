# Jotai Atoms Reference

This document provides a comprehensive reference to all Jotai atoms defined in the Inventory Dashboard project.

## Atoms Structure

All atoms are organized in the `lib/atoms/` directory:
- `atoms.ts` - Main atoms for UI state, data cache, forms
- `auth.ts` - Authentication-specific atoms

## Main Atoms (`lib/atoms/atoms.ts`)

### UI State Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `sidebarOpenAtom` | `boolean` | Controls sidebar visibility (persisted) |
| `themeAtom` | `'light' \| 'dark' \| 'system'` | Theme preference (persisted) |
| `leftPanelExpandedAtom` | `boolean` | Left panel collapse state (persisted) |
| `rightPanelExpandedAtom` | `boolean` | Right panel collapse state (persisted) |
| `isLoadingAtom` | `boolean` | Global loading indicator |
| `uploadProgressAtom` | `number` | File upload progress (0-100) |
| `processingStatusAtom` | `'idle' \| 'uploading' \| 'processing' \| 'complete' \| 'error'` | Processing workflow status |

### Search and Filter Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `searchQueryAtom` | `string` | Global search query |
| `activeFiltersAtom` | `object` | Active filter settings |
| `selectedItemsAtom` | `number[]` | Selected item IDs |
| `selectedRoomsAtom` | `number[]` | Selected room IDs |
| `selectionModeAtom` | `'single' \| 'multi'` | Selection mode |

### View Preference Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `viewModeAtom` | `'grid' \| 'list'` | View layout preference (persisted) |
| `sortByAtom` | `'name' \| 'date' \| 'price' \| 'category'` | Sort field |
| `sortOrderAtom` | `'asc' \| 'desc'` | Sort direction |

### Data Cache Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `itemsAtom` | `Item[]` | Cached items data |
| `roomsAtom` | `Room[]` | Cached rooms data |
| `tagsAtom` | `Tag[]` | Cached tags data |
| `maintenanceTasksAtom` | `Maintenance[]` | Cached maintenance tasks |
| `documentsAtom` | `Document[]` | Cached documents |

### Form State Atoms

#### Item Form
| Atom | Type | Purpose |
|------|------|---------|
| `itemFormAtom` | `object` | Complete item form state including all fields |

#### Room Form
| Atom | Type | Purpose |
|------|------|---------|
| `roomFormAtom` | `object` | Room form state |

#### Maintenance Form
| Atom | Type | Purpose |
|------|------|---------|
| `maintenanceFormAtom` | `object` | Maintenance form state |

### Media Upload Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `uploadQueueAtom` | `File[]` | Files queued for upload |
| `uploadedFilesAtom` | `{photos: File[], documents: File[]}` | Uploaded files by type |
| `photoPreviewUrlsAtom` | `string[]` | Preview URLs for photos |
| `documentPreviewNamesAtom` | `string[]` | Document filenames for preview |

### Dashboard Stats Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `dashboardStatsAtom` | `object` | Dashboard statistics data |

### Modal/Dialog State Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `deleteConfirmAtom` | `object` | Delete confirmation dialog state |
| `mediaModalAtom` | `object` | Media viewer modal state |
| `notificationAtom` | `object` | Toast notification state |

### Utility Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `bumpSessionAtom` | `number` | Trigger data refetch |
| `initFinishedAtom` | `boolean` | App initialization complete |
| `currentPageAtom` | `string` | Current active route |
| `hoveredItemAtom` | `number \| null` | Hovered item ID |
| `hoveredRoomAtom` | `number \| null` | Hovered room ID |

### Derived Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `filteredItemsAtom` | `Item[]` | Items filtered by search/filters |
| `totalInventoryValueAtom` | `number` | Total value of all items |
| `itemsNeedingMaintenanceAtom` | `Item[]` | Items requiring maintenance |
| `itemsByRoomAtom` | `array` | Items grouped by room |
| `unassignedItemsAtom` | `Item[]` | Items without room assignment |
| `categoriesAtom` | `string[]` | Unique categories list |

### Action Atoms

| Atom | Type | Purpose |
|------|------|---------|
| `resetFiltersAtom` | `write-only` | Reset all filters to default |
| `clearItemFormAtom` | `write-only` | Clear item form data |
| `showNotificationAtom` | `write-only` | Show toast notification |

## Auth Atoms (`lib/atoms/auth.ts`)

| Atom | Type | Purpose |
|------|------|---------|
| `userAtom` | `{id, email, name} \| null` | Current user data (persisted) |
| `isAuthenticatedAtom` | `boolean` | Derived auth state |
| `loginFormAtom` | `object` | Login form state |
| `signupFormAtom` | `object` | Signup form state |
| `authLoadingAtom` | `boolean` | Auth operation loading |
| `sessionTokenAtom` | `string \| null` | Session token (persisted) |

## Usage Examples

### Reading an Atom
```typescript
import { useAtom, useAtomValue } from 'jotai'
import { itemsAtom, searchQueryAtom } from '@/lib/atoms/atoms'

// Read-only access
const items = useAtomValue(itemsAtom)

// Read and write access
const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
```

### Writing to an Atom
```typescript
import { useSetAtom } from 'jotai'
import { showNotificationAtom } from '@/lib/atoms/atoms'

const showNotification = useSetAtom(showNotificationAtom)

// Show a notification
showNotification({
  title: "Success",
  message: "Item created successfully",
  type: "success"
})
```

### Using Derived Atoms
```typescript
import { useAtomValue } from 'jotai'
import { filteredItemsAtom } from '@/lib/atoms/atoms'

// Automatically updates when dependencies change
const filteredItems = useAtomValue(filteredItemsAtom)
```

## Best Practices

1. **Use `useAtomValue` for read-only access** - Prevents unnecessary re-renders
2. **Use `useSetAtom` for write-only access** - When you only need to update
3. **Use `atomWithStorage` for persistent data** - Automatically saves to localStorage
4. **Create derived atoms for computed values** - Automatic memoization
5. **Use action atoms for complex operations** - Encapsulate logic

## Migration from useState

### Before (useState)
```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [items, setItems] = useState<Item[]>([])
```

### After (Jotai)
```typescript
const [isLoading, setIsLoading] = useAtom(isLoadingAtom)
const [error, setError] = useAtom(errorAtom)
const [items, setItems] = useAtom(itemsAtom)
```

## Benefits

1. **Global State Management** - Share state across components without prop drilling
2. **Automatic Optimization** - Only components using an atom re-render
3. **Persistence** - Built-in localStorage support
4. **Type Safety** - Full TypeScript support
5. **Derived State** - Computed values update automatically
6. **Async Support** - Atoms can be async
7. **DevTools** - Better debugging with Jotai DevTools 