import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part, GenerationConfig } from '@google/generative-ai';

// Get API key from environment variable
const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('GOOGLE_AI_API_KEY is not set in environment variables');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { image, prompt } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Construct the detection prompt
    const detectionPrompt = `Detect ${prompt || 'household items, furniture, electronics, books, kitchen items, decorative items'} in this image. Focus on identifying individual household items that someone would want to catalog in a home inventory. 
    
Output ONLY a valid JSON array where each entry is an object with exactly two fields:
- "box_2d": an array of 4 numbers [ymin, xmin, ymax, xmax] as percentages of image dimensions from 0 to 1000
- "label": a string with a descriptive label that includes the item type and any visible brand names or distinguishing features

Example format:
[
  {"box_2d": [100, 200, 300, 400], "label": "Black ceramic coffee mug"},
  {"box_2d": [500, 600, 700, 800], "label": "Stainless steel cooking pot"}
]

Ensure labels are concise and user-friendly for an inventory system. Return ONLY the JSON array, no other text.`;

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Prepare the request parts
    const requestParts: Part[] = [
      { inlineData: { mimeType: 'image/png', data: base64Data } },
      { text: detectionPrompt }
    ];

    // Configure generation parameters
    const generationConfig: GenerationConfig = {
      temperature: 0.5, // Lower temperature for more consistent results
    };

    // Use gemini-1.5-flash model for faster processing
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: requestParts }],
      generationConfig
    });

    // Extract response text
    const response = result.response;
    let responseText = '';
    
    if (typeof response.text === 'function') {
      responseText = response.text();
    } else if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          responseText += part.text;
        }
      }
    }

    console.log('Raw AI response:', responseText);

    // Clean up response text
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    }
    responseText = responseText.trim();

    // Parse the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (jsonError) {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        console.error('No JSON array found in response:', responseText);
        throw new Error('AI response does not contain valid JSON array');
      }
    }

    // Validate response structure
    if (!Array.isArray(parsedResponse)) {
      throw new Error('AI response is not an array');
    }

    // Transform coordinates from 0-1000 to 0-1 range
    const items = parsedResponse.map((item: any) => {
      if (!item.box_2d || !item.label) {
        console.warn('Invalid item structure:', item);
        return null;
      }

      const [ymin, xmin, ymax, xmax] = item.box_2d;
      return {
        x: xmin / 1000,
        y: ymin / 1000,
        width: (xmax - xmin) / 1000,
        height: (ymax - ymin) / 1000,
        label: item.label,
        confidence: 0.9 // Default confidence since Gemini doesn't provide it
      };
    }).filter(Boolean);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      items,
      processingTime,
      message: `Detected ${items.length} items`
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime,
        success: false
      },
      { status: 500 }
    );
  }
} 