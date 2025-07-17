import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part, GenerationConfig } from '@google/generative-ai';

// Get API key from environment variable
const apiKey = process.env.GOOGLE_AI_API_KEY;

// Allow overriding the Gemini model via env; default to the latest accurate model
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-pro';

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

    // Use the specified Gemini model (default: gemini-1.5-pro for higher accuracy)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
    
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

    // Additional cleaning for Gemini 2.5 Pro responses
    // Fix common JSON syntax errors
    responseText = responseText
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/"label":\s*"label":/g, '"label":')  // Fix duplicate label keys
      .replace(/"label":\s*"([^"]*)",\s*"label":\s*"([^"]*)"/g, '"label": "$2"')  // Fix duplicate labels
      .replace(/}\s*{/g, '}, {')  // Add missing commas between objects
      .replace(/]\s*\[/g, '], [')  // Add missing commas between arrays

    // Parse the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing failed, attempting repair:', jsonError);
      console.error('Response text:', responseText);
      
      // Try to extract and repair JSON array from the response
      let jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        let jsonText = jsonMatch[0];
        
        // Additional repair attempts
        jsonText = jsonText
          .replace(/"\s*}/g, '"}')  // Fix unterminated strings
          .replace(/{\s*"/g, '{"')  // Fix object start
          .replace(/,\s*,/g, ',')  // Remove double commas
          .replace(/:\s*,/g, ': "",')  // Fix empty values
        
        try {
          parsedResponse = JSON.parse(jsonText);
        } catch (e) {
          console.error('Failed to parse repaired JSON:', e);
          console.error('Repaired JSON text:', jsonText);
          
          // Last resort: try to manually extract box_2d and label pairs
          try {
            const boxMatches = jsonText.match(/"box_2d":\s*\[([^\]]+)\]/g);
            const labelMatches = jsonText.match(/"label":\s*"([^"]+)"/g);
            
            if (boxMatches && labelMatches) {
              parsedResponse = boxMatches.map((boxMatch, index) => {
                const coordMatch = boxMatch.match(/\[([^\]]+)\]/);
                const coords = coordMatch ? coordMatch[1].split(',').map(n => parseInt(n.trim())) : [0, 0, 100, 100];
                const labelMatch = labelMatches[index]?.match(/"([^"]+)"/);
                const label = labelMatch ? labelMatch[1] : 'Unknown item';
                return { box_2d: coords, label };
              });
            } else {
              throw new Error('Could not extract valid items from response');
            }
          } catch (extractError) {
            console.error('Manual extraction failed:', extractError);
            throw new Error('Failed to parse AI response as JSON');
          }
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