// GoogleGenerativeAI moved to server-side API route

export interface BoundingBox {
  x: number // 0-1 normalized
  y: number // 0-1 normalized
  width: number // 0-1 normalized
  height: number // 0-1 normalized
  label: string
  confidence?: number
}

export interface DetectedItem {
  boundingBox: BoundingBox
  category: string
  description: string
  metadata?: {
    brand?: string
    condition?: string
    estimatedValue?: string
    color?: string
    material?: string
  }
}

export interface AIAnalysisResult {
  items: DetectedItem[]
  totalItemsDetected: number
  processingTime: number
}

class AIService {
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // AI service now uses server-side API route
    this.isInitialized = true
  }

  public isAvailable(): boolean {
    // AI service is always available (server handles API key)
    return this.isInitialized
  }

  // imageToBase64 moved to server-side processing

  private resizeImage(file: File, maxSize: number = 768): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/png' }))
          } else {
            resolve(file)
          }
        }, 'image/png', 0.9)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Detection prompt moved to server-side API route

  public async analyzeImage(file: File): Promise<AIAnalysisResult> {
    const startTime = Date.now()

    try {
      // Resize image for better processing
      const resizedFile = await this.resizeImage(file)
      
      // Create form data for API request
      const formData = new FormData()
      formData.append('image', resizedFile)

      // Call the server-side API route
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI analysis failed')
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      return {
        items: result.items,
        totalItemsDetected: result.totalItemsDetected,
        processingTime
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // AI response parsing moved to server-side API route

  public async generateItemMetadata(itemName: string, imageData?: string): Promise<any> {
    try {
      // Call server-side API route for metadata generation
      const response = await fetch('/api/ai/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName, imageData })
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating metadata:', error)
      return null
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService 