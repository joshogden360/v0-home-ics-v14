import { GoogleGenerativeAI } from '@google/generative-ai'

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
  private genAI: GoogleGenerativeAI | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.warn('Google AI API key not found. AI features will be disabled.')
      return
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Google AI:', error)
    }
  }

  public isAvailable(): boolean {
    return this.isInitialized && this.genAI !== null
  }

  private async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

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

  private getDetectionPrompt(): string {
    return `Analyze this image and detect individual household items, furniture, and objects. For each item you identify, provide:

1. Bounding box coordinates as percentages (0-100) in format [ymin, xmin, ymax, xmax]
2. A descriptive label that includes item type, color, and notable features
3. Category classification
4. Brief description

Focus on:
- Individual items that could be inventoried
- Furniture pieces
- Electronics and appliances
- Decorative objects
- Storage containers
- Books, artwork, plants
- Kitchen items, tools, etc.

Ignore:
- Walls, floors, ceilings
- Built-in fixtures
- Very small items (< 2% of image)

Output ONLY a valid JSON array with this exact structure:
[
  {
    "box_2d": [ymin, xmin, ymax, xmax],
    "label": "descriptive label",
    "category": "category name",
    "description": "brief description",
    "metadata": {
      "color": "primary color",
      "material": "material if obvious",
      "condition": "estimated condition"
    }
  }
]

Ensure coordinates are integers between 0-100 representing percentages.`
  }

  public async analyzeImage(file: File): Promise<AIAnalysisResult> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available')
    }

    const startTime = Date.now()

    try {
      // Resize image for better processing
      const resizedFile = await this.resizeImage(file)
      const base64Data = await this.imageToBase64(resizedFile)
      
      const model = this.genAI!.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 4096,
        }
      })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: resizedFile.type,
            data: base64Data
          }
        },
        { text: this.getDetectionPrompt() }
      ])

      const response = await result.response
      const text = response.text()

      // Parse the JSON response
      const detectedItems = this.parseAIResponse(text)
      const processingTime = Date.now() - startTime

      return {
        items: detectedItems,
        totalItemsDetected: detectedItems.length,
        processingTime
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseAIResponse(text: string): DetectedItem[] {
    try {
      // Clean up the response text
      let cleanText = text.trim()
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '')
      
      // Try to find JSON array in the response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const jsonData = JSON.parse(jsonMatch[0])
      
      if (!Array.isArray(jsonData)) {
        throw new Error('Response is not an array')
      }

      return jsonData.map((item: any) => {
        // Validate required fields
        if (!item.box_2d || !Array.isArray(item.box_2d) || item.box_2d.length !== 4) {
          throw new Error('Invalid bounding box format')
        }

        const [ymin, xmin, ymax, xmax] = item.box_2d.map(Number)
        
        // Convert from percentage to normalized (0-1)
        const boundingBox: BoundingBox = {
          x: Math.max(0, Math.min(100, xmin)) / 100,
          y: Math.max(0, Math.min(100, ymin)) / 100,
          width: Math.max(0, Math.min(100, xmax - xmin)) / 100,
          height: Math.max(0, Math.min(100, ymax - ymin)) / 100,
          label: item.label || 'Unknown item'
        }

        const detectedItem: DetectedItem = {
          boundingBox,
          category: item.category || 'Uncategorized',
          description: item.description || item.label || 'No description',
          metadata: {
            color: item.metadata?.color,
            material: item.metadata?.material,
            condition: item.metadata?.condition || 'Unknown'
          }
        }

        return detectedItem
      }).filter(item => {
        // Filter out invalid boxes
        const box = item.boundingBox
        return box.width > 0.02 && box.height > 0.02 && // Minimum size
               box.x >= 0 && box.y >= 0 && 
               box.x + box.width <= 1 && box.y + box.height <= 1 // Within bounds
      })
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.log('Raw response:', text)
      return []
    }
  }

  public async generateItemMetadata(itemName: string, imageData?: string): Promise<any> {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = `Generate detailed metadata for this household item: "${itemName}"

Provide information in JSON format:
{
  "brand": "likely brand or 'Unknown'",
  "estimatedValue": "price range like '$10-20' or 'Unknown'",
  "condition": "estimated condition",
  "category": "specific category",
  "subcategory": "more specific classification",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "detailed description",
  "careInstructions": "basic care/maintenance tips",
  "specifications": {
    "dimensions": "typical dimensions if known",
    "weight": "typical weight if known",
    "material": "primary material"
  }
}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text.replace(/```json\s*/, '').replace(/```\s*$/, ''))
      } catch {
        return { description: text.trim() }
      }
    } catch (error) {
      console.error('Error generating metadata:', error)
      return null
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService 