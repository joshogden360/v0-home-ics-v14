import { PhotoToItemsWorkflow } from '@/components/ai/photo-to-items-workflow'

export default function CreateItemsPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4"> {/* Account for nav height with padding */}
      <div className="mb-3">
        <h1 className="text-xl font-bold tracking-tight">Create Items from Photos</h1>
        <p className="text-xs text-muted-foreground">
          Upload photos to automatically detect and add items to your inventory
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <PhotoToItemsWorkflow />
      </div>
    </div>
  )
} 