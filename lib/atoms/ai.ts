import { atom } from 'jotai'
import type { DetectedItem, BoundingBox, AIAnalysisResult } from '@/lib/services/ai-service'

// Current uploaded image for analysis
export const currentImageAtom = atom<File | null>(null)
export const imagePreviewUrlAtom = atom<string | null>(null)

// AI analysis state
export const aiAnalysisLoadingAtom = atom(false)
export const aiAnalysisErrorAtom = atom<string | null>(null)
export const aiAnalysisResultAtom = atom<AIAnalysisResult | null>(null)

// Detected items and bounding boxes
export const detectedItemsAtom = atom<DetectedItem[]>([])
export const boundingBoxesAtom = atom<BoundingBox[]>([])

// Selection state for detected items
export const selectedDetectedItemsAtom = atom<number[]>([])
export const hoveredDetectedItemAtom = atom<number | null>(null)
export const selectionModeAtom = atom<'single' | 'multi' | 'crop'>('single')

// Image processing state
export const imageZoomAtom = atom(1)
export const imagePanAtom = atom({ x: 0, y: 0 })
export const imageContainerSizeAtom = atom({ width: 0, height: 0 })

// Crop modal state
export const cropModalOpenAtom = atom(false)
export const cropSelectionAtom = atom<BoundingBox | null>(null)

// Processing workflow state
export const processingStepAtom = atom<'upload' | 'analyze' | 'review' | 'save' | 'complete'>('upload')

// Derived atoms
export const hasDetectedItemsAtom = atom((get) => {
  const items = get(detectedItemsAtom)
  return items.length > 0
})

export const selectedItemsCountAtom = atom((get) => {
  const selected = get(selectedDetectedItemsAtom)
  return selected.length
})

export const isAnalysisCompleteAtom = atom((get) => {
  const result = get(aiAnalysisResultAtom)
  const loading = get(aiAnalysisLoadingAtom)
  return result !== null && !loading
})

// Action atoms
export const clearAnalysisAtom = atom(null, (get, set) => {
  set(aiAnalysisResultAtom, null)
  set(detectedItemsAtom, [])
  set(boundingBoxesAtom, [])
  set(selectedDetectedItemsAtom, [])
  set(hoveredDetectedItemAtom, null)
  set(aiAnalysisErrorAtom, null)
  set(processingStepAtom, 'upload')
  set(cropModalOpenAtom, false)
  set(cropSelectionAtom, null)
})

export const resetImageViewAtom = atom(null, (get, set) => {
  set(imageZoomAtom, 1)
  set(imagePanAtom, { x: 0, y: 0 })
})

export const selectAllDetectedItemsAtom = atom(null, (get, set) => {
  const items = get(detectedItemsAtom)
  const allIndices = items.map((_, index) => index)
  set(selectedDetectedItemsAtom, allIndices)
})

export const deselectAllDetectedItemsAtom = atom(null, (get, set) => {
  set(selectedDetectedItemsAtom, [])
})

export const toggleDetectedItemSelectionAtom = atom(
  null,
  (get, set, itemIndex: number) => {
    const currentSelected = get(selectedDetectedItemsAtom)
    const selectionMode = get(selectionModeAtom)
    
    if (selectionMode === 'single') {
      set(selectedDetectedItemsAtom, [itemIndex])
    } else if (selectionMode === 'multi') {
      const isSelected = currentSelected.includes(itemIndex)
      if (isSelected) {
        set(selectedDetectedItemsAtom, currentSelected.filter(i => i !== itemIndex))
      } else {
        set(selectedDetectedItemsAtom, [...currentSelected, itemIndex])
      }
    }
  }
)

// AI analysis workflow atoms
export const startAnalysisAtom = atom(null, async (get, set, image: File) => {
  set(aiAnalysisLoadingAtom, true)
  set(aiAnalysisErrorAtom, null)
  set(processingStepAtom, 'analyze')
  set(currentImageAtom, image)
  
  // Create preview URL
  const previewUrl = URL.createObjectURL(image)
  set(imagePreviewUrlAtom, previewUrl)
})

export const setAnalysisResultAtom = atom(null, (get, set, result: AIAnalysisResult) => {
  set(aiAnalysisResultAtom, result)
  set(detectedItemsAtom, result.items)
  set(boundingBoxesAtom, result.items.map(item => item.boundingBox))
  set(aiAnalysisLoadingAtom, false)
  set(processingStepAtom, 'review')
})

export const setAnalysisErrorAtom = atom(null, (get, set, error: string) => {
  set(aiAnalysisErrorAtom, error)
  set(aiAnalysisLoadingAtom, false)
  set(processingStepAtom, 'upload')
})

// Image manipulation atoms
export const zoomInAtom = atom(null, (get, set) => {
  const currentZoom = get(imageZoomAtom)
  const newZoom = Math.min(currentZoom * 1.2, 5)
  set(imageZoomAtom, newZoom)
})

export const zoomOutAtom = atom(null, (get, set) => {
  const currentZoom = get(imageZoomAtom)
  const newZoom = Math.max(currentZoom / 1.2, 0.1)
  set(imageZoomAtom, newZoom)
})

export const setPanAtom = atom(null, (get, set, delta: { x: number; y: number }) => {
  const currentPan = get(imagePanAtom)
  set(imagePanAtom, {
    x: currentPan.x + delta.x,
    y: currentPan.y + delta.y
  })
}) 