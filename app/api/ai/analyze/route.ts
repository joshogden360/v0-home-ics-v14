import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    })

    const prompt = `Analyze this image and detect individual household items, furniture, and objects. For each item you identify, provide:

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

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: base64
        }
      },
      { text: prompt }
    ])

    const response = await result.response
    const text = response.text()

    // Parse and process the response
    let cleanText = text.trim()
    cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '')
    
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const jsonData = JSON.parse(jsonMatch[0])
    
    const items = jsonData.map((item: any) => {
      const [ymin, xmin, ymax, xmax] = item.box_2d.map(Number)
      
      return {
        boundingBox: {
          x: Math.max(0, Math.min(100, xmin)) / 100,
          y: Math.max(0, Math.min(100, ymin)) / 100,
          width: Math.max(0, Math.min(100, xmax - xmin)) / 100,
          height: Math.max(0, Math.min(100, ymax - ymin)) / 100,
          label: item.label || 'Unknown item'
        },
        category: item.category || 'Uncategorized',
        description: item.description || item.label || 'No description',
        metadata: {
          color: item.metadata?.color,
          material: item.metadata?.material,
          condition: item.metadata?.condition || 'Unknown'
        }
      }
    }).filter((item: any) => {
      const box = item.boundingBox
      return box.width > 0.02 && box.height > 0.02 &&
             box.x >= 0 && box.y >= 0 && 
             box.x + box.width <= 1 && box.y + box.height <= 1
    })

    return NextResponse.json({
      items,
      totalItemsDetected: items.length,
      processingTime: Date.now() - Date.now()
    })

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    )
  }
} 