// GoogleGenerativeAI moved to server-side API route

import { ImagePreprocessor } from './image-preprocessor'

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
  private preprocessor: ImagePreprocessor

  constructor() {
    this.preprocessor = new ImagePreprocessor()
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

  public async analyzeImage(file: File, userPrompt?: string): Promise<AIAnalysisResult> {
    const startTime = Date.now()

    try {
      console.log('Starting AI analysis for file:', file.name, 'size:', file.size)
      
      // Use the new preprocessor
      const processed = await this.preprocessor.processImage(file)
      console.log('Image preprocessed:', {
        quality: processed.metadata.quality,
        needsRotation: processed.metadata.needsRotation,
        dimensions: `${processed.metadata.width}x${processed.metadata.height}`
      })
      
      // Generate optimal prompt based on image characteristics
      const prompt = this.preprocessor.generateOptimalPrompt(processed.metadata, userPrompt)
      
      console.log('Calling AI analysis API...')
      // Call the server-side API route with JSON
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: processed.dataUrl,
          prompt: prompt
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

  /**
   * Batch analyze multiple images
   */
  public async analyzeBatch(files: File[], userPrompt?: string): Promise<AIAnalysisResult[]> {
    // Process images first
    const processedImages = await this.preprocessor.processBatch(files)
    
    // Analyze in parallel with rate limiting
    const CONCURRENT_LIMIT = 2
    const results: AIAnalysisResult[] = []
    
    for (let i = 0; i < processedImages.length; i += CONCURRENT_LIMIT) {
      const batch = processedImages.slice(i, i + CONCURRENT_LIMIT)
      const batchPromises = batch.map(async (processed, index) => {
        const file = files[i + index]
        const prompt = this.preprocessor.generateOptimalPrompt(processed.metadata, userPrompt)
        
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: processed.dataUrl, prompt })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to analyze ${file.name}`)
        }
        
        const result = await response.json()
        return this.transformResponse(result)
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  private transformResponse(apiResult: any): AIAnalysisResult {
    const items: DetectedItem[] = apiResult.items.map((item: any) => ({
      boundingBox: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        label: item.label,
        confidence: item.confidence
      },
      category: item.label.split(' ')[0],
      description: item.label,
      metadata: {
        condition: 'Unknown',
        estimatedValue: 'Not assessed'
      }
    }))

    return {
      items,
      totalItemsDetected: items.length,
      processingTime: apiResult.processingTime || 0
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