/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// IMPORTANT: Import from '@google/generative-ai', NOT '@google/genai'
// The correct package is @google/generative-ai (npm install @google/generative-ai)
import {GoogleGenerativeAI, GenerationConfig, Part} from '@google/generative-ai';
import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useState, ChangeEvent, KeyboardEvent} from 'react';
import {
  BoundingBoxes2DAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  LinesAtom,
  ProcessingStatusAtom,
  ShareStream,
  TemperatureAtom,
  UploadProgressAtom,
  VideoRefAtom,
} from '../state/atoms';
import {lineOptions} from '../utils/consts';
import {getSvgPathFromStroke, loadImage} from '../utils/utils';

// ENVIRONMENT SETUP:
// 1. Create a .env.local file in the project root (NOT .env)
// 2. Add: VITE_GEMINI_API_KEY=your-api-key-here
// 3. Get your API key from: https://makersuite.google.com/app/apikey
// 4. Vite only exposes env vars prefixed with VITE_ to client code
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenerativeAI | undefined;

// Debug logging for API key - helps identify common setup issues
console.log('Gemini API Key present:', !!apiKey);
console.log('API Key length:', apiKey?.length);

if (apiKey) {
  try {
    ai = new GoogleGenerativeAI(apiKey);
    console.log('GoogleGenerativeAI initialized successfully');
  } catch (error) {
    console.error('Error initializing GoogleGenerativeAI:', error);
  }
} else {
  console.error(
    "VITE_GEMINI_API_KEY is not set. Please ensure it is in your .env.local file and correctly prefixed for Vite."
  );
}

export function Prompt() {
  const [temperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [stream] = useAtom(ShareStream);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [targetPrompt, setTargetPrompt] = useState(
    'household items, furniture, electronics, books, kitchen items, decorative items'
  );
  const [processingStatus, setProcessingStatus] = useAtom(ProcessingStatusAtom);
  const [uploadProgress, setUploadProgress] = useAtom(UploadProgressAtom);

  // AI Prompt construction - be very specific about output format
  // Common issues:
  // - AI returns markdown-wrapped JSON (```json ... ```)
  // - AI includes explanatory text before/after JSON
  // - JSON syntax errors (trailing commas, wrong quotes)
  const get2dPrompt = () =>
    `Detect ${targetPrompt} in this image. Focus on identifying individual household items that someone would want to catalog in a home inventory. 
    
Output ONLY a valid JSON array where each entry is an object with exactly two fields:
- "box_2d": an array of 4 numbers [ymin, xmin, ymax, xmax] as percentages of image dimensions from 0 to 1000
- "label": a string with a descriptive label that includes the item type and any visible brand names or distinguishing features

Example format:
[
  {"box_2d": [100, 200, 300, 400], "label": "Black ceramic coffee mug"},
  {"box_2d": [500, 600, 700, 800], "label": "Stainless steel cooking pot"}
]

Ensure labels are concise and user-friendly for an inventory system. Return ONLY the JSON array, no other text.`;

  async function handleSend() {
    // Check if AI SDK is initialized
    if (!ai) {
      console.error("GoogleGenAI SDK not initialized. API Key might be missing or invalid.");
      setProcessingStatus('error');
      setTimeout(() => setProcessingStatus('idle'), 5000);
      return;
    }
    if (!imageSrc && !stream) {
      return;
    }

    setProcessingStatus('uploading');
    setBoundingBoxes2D([]);
    setLines([]);
    setUploadProgress(0);

    let activeDataURL: string | undefined;
    const maxSize = 768; // Resize images to max 768px for faster processing
    const copyCanvas = document.createElement('canvas');
    const ctx = copyCanvas.getContext('2d');

    if (!ctx) {
      console.error("Failed to get canvas context.");
      setProcessingStatus('error');
      return;
    }

    try {
      // Prepare image from either video stream or uploaded image
      if (stream && videoRef.current) {
        const video = videoRef.current;
        const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
        copyCanvas.width = video.videoWidth * scale;
        copyCanvas.height = video.videoHeight * scale;
        ctx.drawImage(video, 0, 0, copyCanvas.width, copyCanvas.height);
      } else if (imageSrc) {
        const image = await loadImage(imageSrc);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        copyCanvas.width = image.width * scale;
        copyCanvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, copyCanvas.width, copyCanvas.height);
      }
      setUploadProgress(30);

      if (lines.length > 0) {
        for (const line of lines) {
          const p = new Path2D(
            getSvgPathFromStroke(
              getStroke(
                line[0].map(([x, y]) => [x * copyCanvas.width, y * copyCanvas.height, 0.5]),
                lineOptions
              )
            )
          );
          ctx.fillStyle = line[1];
          ctx.fill(p);
        }
      }
      activeDataURL = copyCanvas.toDataURL('image/png', 0.9);
      setUploadProgress(60);
    } catch (err) {
      console.error("Error preparing image:", err);
      setProcessingStatus('error');
      setUploadProgress(0);
      return;
    }

    if (!activeDataURL) {
        console.error("Failed to generate image data URL.");
        setProcessingStatus('error');
        return;
    }

    setProcessingStatus('processing');
    setHoverEntered(false);

    // Configure AI generation parameters
    const generationConfig: GenerationConfig = {
      temperature: temperature, // Controls randomness (0-1)
    };

    // Model options:
    // - gemini-1.5-flash: Fast, good for object detection
    // - gemini-1.5-pro: More accurate but slower
    const modelName = 'gemini-1.5-flash';

    // Prepare the request with base64 image data
    const requestParts: Part[] = [
        { inlineData: { mimeType: 'image/png', data: activeDataURL.replace(/^data:image\/png;base64,/, '') } },
        { text: get2dPrompt() },
    ];

    try {
      // Initialize model and make API request
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({contents: [{role: 'user', parts: requestParts}], generationConfig});
      setUploadProgress(100);

      // Extract text from response - API structure can vary
      const response = result.response;
      let responseText = "";
      if (typeof response.text === 'function') {
        responseText = response.text();
      } else {
        // Fallback for different API response structures
        console.warn("Response object does not have a text method or it's not a function.", response);
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for(const part of response.candidates[0].content.parts){
                if(part.text) {
                    responseText += part.text;
                }
            }
        }
      }
      
      // Remove markdown code blocks if present
      if (responseText && responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }

      if (!responseText) {
        throw new Error('Empty or invalid response from AI model.');
      }

      // Clean up the response text to handle common JSON issues
      responseText = responseText.trim();
      
      // Debug logging - crucial for troubleshooting
      console.log('Raw response text:', responseText);
      console.log('First 200 chars:', responseText.substring(0, 200));

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (jsonError) {
        // Common JSON parsing issues:
        // 1. Extra text before/after JSON
        // 2. Syntax errors (trailing commas, wrong quotes)
        // 3. Escaped characters
        console.error('JSON Parse error:', jsonError);
        console.error('Response that failed to parse:', responseText);
        
        // Try to extract JSON array from the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from response');
          } catch (e) {
            throw new Error('Failed to parse AI response as JSON. Response may be malformed.');
          }
        } else {
          throw new Error('AI response does not contain valid JSON array');
        }
      }

      // Validate the response structure
      if (!Array.isArray(parsedResponse)) {
        throw new Error('AI response is not an array of detected items');
      }

      // Transform AI response to our internal format
      // AI returns coordinates as 0-1000, we need 0-1 for display
      const formattedBoxes = parsedResponse.map(
        (box: { box_2d: [number, number, number, number]; label: string }) => {
          const [ymin, xmin, ymax, xmax] = box.box_2d;
          return {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: box.label,
          };
        }
      );
      setBoundingBoxes2D(formattedBoxes);

      setProcessingStatus('complete');
      setTimeout(() => {
        setProcessingStatus('idle');
      }, 3000);
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('Error processing image with AI:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
        apiKeyPresent: !!apiKey,
        aiInitialized: !!ai
      });
      
      // Common error causes:
      // 1. Invalid API key
      // 2. API quota exceeded
      // 3. Network issues
      // 4. CORS problems (shouldn't happen with official SDK)
      // 5. Model name typos
      // 6. Malformed AI response
      
      setProcessingStatus('error');
      setTimeout(() => {
        setProcessingStatus('idle');
      }, 5000);
    } finally {
      setUploadProgress(0);
    }
  }

  const getStatusMessage = () => {
    switch (processingStatus) {
      case 'uploading':
        return 'Preparing image...';
      case 'processing':
        return 'AI is analyzing items...';
      case 'complete':
        return 'Scan complete! Review detected items.';
      case 'error':
        return 'Error analyzing image. Please try again.';
      default:
        return 'Enter keywords for items to detect (e.g., books, kitchenware)';
    }
  };

  const isProcessing = processingStatus === 'uploading' || processingStatus === 'processing';

  return (
    <div className="w-full space-y-2">
      <div
        className={`text-sm transition-all duration-300 flex items-center ${
          processingStatus === 'complete'
            ? 'text-green-400 font-medium'
            : processingStatus === 'error'
            ? 'text-red-400 font-medium'
            : processingStatus === 'idle'
            ? 'text-gray-300'
            : 'text-blue-400 font-medium'
        }`}
      >
        {(processingStatus === 'uploading' || processingStatus === 'processing') && (
          <span className="loading loading-xs loading-spinner mr-2"></span>
        )}
        {processingStatus === 'complete' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {processingStatus === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {getStatusMessage()}
      </div>
      <div className="flex items-start gap-2">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600 transition-all"
          placeholder="Describe items (e.g., kitchenware, books)"
          value={targetPrompt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetPrompt(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !isProcessing) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isProcessing}
        />
        <div className="flex flex-col items-stretch gap-1">
          <button
            className={`btn btn-sm ${
              processingStatus === 'complete' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            } ${isProcessing ? 'loading' : ''} transition-all`}
            onClick={handleSend}
            disabled={!ai || (!imageSrc && !stream) || isProcessing}
            title="Detect Items in Image"
          >
            {isProcessing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
            <span className="hidden sm:inline ml-1">
              {isProcessing
                ? processingStatus === 'uploading'
                  ? 'Preparing'
                  : 'Scanning'
                : 'Find Items'}
            </span>
          </button>
        </div>
      </div>
      {(processingStatus === 'uploading' || processingStatus === 'processing') &&
        uploadProgress > 0 &&
        uploadProgress < 100 && (
          <progress
            className={`progress ${
              processingStatus === 'uploading' ? 'progress-info' : 'progress-primary'
            } w-full h-1.5 mt-1`}
            value={uploadProgress}
            max="100"
          ></progress>
        )}
    </div>
  );
}
