# AI Integration Reference Guide

This document preserves important patterns and code from the temporary implementation for future reference.

## Key Implementation Patterns

### 1. Gemini API Integration Pattern

```typescript
// Proper Gemini API initialization
import { GoogleGenerativeAI, Part, GenerationConfig } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY; // Server-side
// OR
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Client-side (Vite)

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### 2. Object Detection Prompt Structure

```typescript
const detectionPrompt = `Detect ${targetItems} in this image. Focus on identifying individual household items that someone would want to catalog in a home inventory. 
    
Output ONLY a valid JSON array where each entry is an object with exactly two fields:
- "box_2d": an array of 4 numbers [ymin, xmin, ymax, xmax] as percentages of image dimensions from 0 to 1000
- "label": a string with a descriptive label that includes the item type and any visible brand names or distinguishing features

Example format:
[
  {"box_2d": [100, 200, 300, 400], "label": "Black ceramic coffee mug"},
  {"box_2d": [500, 600, 700, 800], "label": "Stainless steel cooking pot"}
]

Ensure labels are concise and user-friendly for an inventory system. Return ONLY the JSON array, no other text.`;
```

### 3. Image Processing Pattern

```typescript
// Resize image before sending to API
const resizeImage = async (file: File, maxSize: number = 768): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
```

### 4. Coordinate Transformation

```typescript
// Transform AI response coordinates from 0-1000 to 0-1 range
const transformCoordinates = (items: any[]) => {
  return items.map(item => {
    const [ymin, xmin, ymax, xmax] = item.box_2d;
    return {
      x: xmin / 1000,
      y: ymin / 1000,
      width: (xmax - xmin) / 1000,
      height: (ymax - ymin) / 1000,
      label: item.label
    };
  });
};
```

### 5. Auto-trigger Analysis Pattern

```typescript
// Auto-trigger object detection after image upload
useEffect(() => {
  if (uploadedImage && !detectedItems.length && !isAnalyzing) {
    const timer = setTimeout(() => {
      handleAnalyzeImage();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [uploadedImage]);
```

### 6. Bounding Box Interaction Pattern

```typescript
// Handle box selection with different modes
const handleBoxClick = (boxIndex: number, box: any, e: React.MouseEvent) => {
  e.stopPropagation();
  
  if (selectionMode === 'multi') {
    const newSelected = new Set(selectedBoxes);
    if (newSelected.has(boxIndex)) {
      newSelected.delete(boxIndex);
    } else {
      newSelected.add(boxIndex);
    }
    setSelectedBoxes(newSelected);
  } else if (selectionMode === 'crop') {
    setSelectedBox(box);
    setShowCropModal(true);
  } else {
    // Single selection mode - save to inventory
    handleSaveToInventory(box, boxIndex);
  }
};
```

### 7. Inventory Item Creation Pattern

```typescript
const createInventoryItem = async (box: any) => {
  const inventoryItem = {
    id: generateUniqueId(),
    imageUrl: await cropBoxToImage(box),
    label: box.label,
    category: box.label.split(' ')[0],
    tags: [box.label],
    dateAdded: new Date().toISOString(),
    sourceImageUrl: effectiveImageSrc || undefined,
    notes: '',
    originalBox: box,
    metadata: await generateItemMetadata(effectiveImageSrc || '', box.label),
  };
  return inventoryItem;
};
```

### 8. Zoom and Pan Controls

```typescript
// Zoom handling
const handleWheel = (e: React.WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
    setZoom(newZoom);
  }
};

// Pan handling
const handleMouseMove = (e: React.MouseEvent) => {
  if (isDragging) {
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setPan({
      x: lastPan.x + deltaX,
      y: lastPan.y + deltaY
    });
  }
};
```

### 9. Perfect Freehand Integration

```typescript
import getStroke from 'perfect-freehand';

const getSvgPathFromStroke = (stroke: any) => {
  if (!stroke.length) return '';
  
  const d = stroke.reduce(
    (acc: any, [x0, y0]: any, i: number, arr: any) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );
  
  d.push('Z');
  return d.join(' ');
};
```

### 10. Response Parsing Pattern

```typescript
// Clean up AI response text
let responseText = result.response.text();
if (responseText.includes('```json')) {
  responseText = responseText.split('```json')[1].split('```')[0];
}

// Try to extract JSON array from response
const jsonMatch = responseText.match(/\[[\s\S]*\]/);
if (jsonMatch) {
  parsedResponse = JSON.parse(jsonMatch[0]);
}
```

## Important State Atoms

```typescript
// Core state atoms for AI features
export const ImageSrcAtom = atom<string | null>(null);
export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);
export const InventoryItemsAtom = atom<InventoryItemType[]>([]);
export const SelectionModeAtom = atom<'single' | 'multi' | 'crop'>('single');
export const ZoomAtom = atom(1);
export const PanAtom = atom({ x: 0, y: 0 });
export const IsLoadingAtom = atom(false);
export const ProcessingStatusAtom = atom<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
```

## Type Definitions

```typescript
export type BoundingBox2DType = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type InventoryItemType = {
  id: string;
  imageUrl: string;
  label: string;
  category?: string;
  tags?: string[];
  dateAdded: string;
  sourceImageUrl?: string;
  notes?: string;
  originalBox?: BoundingBox2DType;
  metadata?: ItemMetadata;
};

export type ItemMetadata = {
  brand?: string;
  condition?: string;
  resaleValue?: string;
  manufacturerWebsite?: string;
  documentationLinks?: string[];
  warrantyInfo?: string;
  description?: string;
};
```

## UI Component Patterns

### Progress Indicator
```typescript
<progress
  className={`progress ${
    processingStatus === 'uploading' ? 'progress-info' : 'progress-primary'
  } w-full h-1.5 mt-1`}
  value={uploadProgress}
  max="100"
></progress>
```

### Selection Mode Toggle
```typescript
<div className="flex gap-1">
  <button
    onClick={() => setSelectionMode('single')}
    className={`btn btn-xs ${
      selectionMode === 'single' ? 'bg-blue-600' : 'bg-gray-700'
    }`}
  >
    Single
  </button>
  <button
    onClick={() => setSelectionMode('multi')}
    className={`btn btn-xs ${
      selectionMode === 'multi' ? 'bg-blue-600' : 'bg-gray-700'
    }`}
  >
    Multi
  </button>
</div>
```

## Future Implementation Notes

1. **Cropping Functionality**: The CropModal component shows how to implement manual crop adjustment with resize handles
2. **Metadata Generation**: Can be extended to call AI for detailed item information
3. **Batch Operations**: Multi-select mode foundation is ready for batch save operations
4. **Drawing Mode**: Perfect-freehand integration ready for manual bounding box drawing
5. **Export/Import**: Consider adding ability to export detected items as JSON
6. **Confidence Scores**: AI doesn't provide confidence scores, but UI is ready to display them
7. **3D Bounding Boxes**: Type definitions include 3D box support for future enhancement
8. **Segmentation Masks**: Foundation exists for pixel-perfect selection masks

## Performance Optimizations

1. Resize images to 768px max before API calls
2. Use canvas for efficient image manipulation
3. Debounce zoom/pan operations
4. Lazy load heavy components
5. Cache processed images in memory
6. Use Web Workers for image processing (future)

## Security Considerations

1. API key should be server-side only
2. Validate file types and sizes
3. Sanitize AI responses
4. Rate limit API calls
5. Add CORS protection for API routes

This reference guide preserves the key patterns and implementations from the temporary folder for future use. 