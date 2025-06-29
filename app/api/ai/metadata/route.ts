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

    const { itemName, imageData } = await request.json()
    
    if (!itemName) {
      return NextResponse.json(
        { error: 'No item name provided' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
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
      const metadata = JSON.parse(text.replace(/```json\s*/, '').replace(/```\s*$/, ''))
      return NextResponse.json(metadata)
    } catch {
      return NextResponse.json({ description: text.trim() })
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return NextResponse.json(
      { error: 'Metadata generation failed' },
      { status: 500 }
    )
  }
} 