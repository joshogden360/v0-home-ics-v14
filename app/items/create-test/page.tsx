import { PhotoToItems } from "@/components/ai/photo-to-items"

export default function CreateItemsTestPage() {
  // Test page without authentication for debugging
  return (
    <div className="container mx-auto py-6">
      <PhotoToItems rooms={[]} />
    </div>
  )
} 