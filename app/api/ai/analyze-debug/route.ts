import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    if (!file) {
      return NextResponse.json({ error: 'No image' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Simpler prompt
    const prompt = `List all the items you can see in this image. For each item, provide its location in the image using coordinates.`

    console.log('Debug: Calling Gemini with simple prompt...')
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
    
    console.log('Debug: Raw Gemini response:', text)

    return NextResponse.json({
      rawResponse: text,
      prompt: prompt,
      imageSize: file.size,
      imageType: file.type
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 