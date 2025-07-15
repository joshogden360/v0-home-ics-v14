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

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private resizeImage(file: File, maxSize: number = 768): Promise<string> {
    return new Promise((resolve, reject) => {
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
        
        // Convert to base64
        resolve(canvas.toDataURL('image/png', 0.9))
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  public async analyzeImage(file: File): Promise<AIAnalysisResult> {
    const startTime = Date.now()

    try {
      console.log('Starting AI analysis for file:', file.name, 'size:', file.size)
      
      // Convert to base64 and resize if needed
      const base64Image = await this.resizeImage(file)
      console.log('Image converted to base64')
      
      console.log('Calling AI analysis API...')
      // Call the server-side API route with JSON
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: 'household items, furniture, electronics, books, kitchen items, decorative items'
        })
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.error || 'AI analysis failed')
      }

      const result = await response.json()
      console.log('API result:', result)

      // Transform the response to match our interface
      const items: DetectedItem[] = result.items.map((item: any) => ({
        boundingBox: {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          label: item.label,
          confidence: item.confidence
        },
        category: item.label.split(' ')[0], // Use first word as category
        description: item.label,
        metadata: {
          condition: 'Unknown',
          estimatedValue: 'Not assessed'
        }
      }))

      return {
        items,
        totalItemsDetected: items.length,
        processingTime: result.processingTime || (Date.now() - startTime)
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

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