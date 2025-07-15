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

import {
  BoundingBox2DType,
  BoundingBoxMaskType,
  InventoryItemType,
  ItemMetadata,
} from '../types/types';
import {GoogleGenerativeAI, Part, GenerationConfig} from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenerativeAI | undefined;

if (apiKey) {
  ai = new GoogleGenerativeAI(apiKey);
} else {
  console.error("VITE_GEMINI_API_KEY is not set. Please ensure it is in your .env.local file.");
}

export function getSvgPathFromStroke(stroke: any) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc: any, [x0, y0]: any, i: number, arr: any) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}

export const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
};

export async function generateItemMetadata(
  imageUrl: string,
  label: string,
): Promise<ItemMetadata> {
  try {
    if (!ai) {
      console.error("GoogleGenAI SDK not initialized");
      return {};
    }
    
    const prompt = `Provide a brief description including brand, condition, resale value, website and warranty information for the item labelled "${label}".`;
    const model = ai.getGenerativeModel({model: 'gemini-1.5-flash'});
    const requestParts: Part[] = [
      {inlineData: {mimeType: 'image/png', data: imageUrl.split(',')[1]}},
      {text: prompt},
    ];

    const generationConfig: GenerationConfig = {temperature: 0.4};

    const result = await model.generateContent({contents: [{role: 'user', parts: requestParts}], generationConfig});
    const response = result.response.text();
    
    if (!response) {
      console.warn('Empty response from AI model');
      return {};
    }
    
    const json = JSON.parse(response.includes('```json') ? response.split('```json')[1].split('```')[0] : response);
    return json as ItemMetadata;
  } catch (e) {
    console.error('metadata generation failed', e);
    return {};
  }
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function saveToInventory(
  box: BoundingBox2DType | BoundingBoxMaskType,
  sourceSrc: string | null
): Promise<InventoryItemType> {
  if (!sourceSrc) {
    throw new Error('Source image is required');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  const image = await loadImage(sourceSrc);
  
  // Calculate dimensions in pixels
  const boxWidth = Math.round(box.width * image.width);
  const boxHeight = Math.round(box.height * image.height);
  const boxX = Math.round(box.x * image.width);
  const boxY = Math.round(box.y * image.height);
  
  // Set canvas size with some padding
  const padding = 0; // Add padding if needed
  canvas.width = boxWidth + (padding * 2);
  canvas.height = boxHeight + (padding * 2);
  
  // Fill with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the cropped portion to the canvas
  ctx.drawImage(
    image,
    boxX, boxY, 
    boxWidth, boxHeight,
    padding, padding, 
    boxWidth, boxHeight
  );
  
  // Convert to data URL - use PNG for better quality with transparency
  const croppedImageUrl = canvas.toDataURL('image/png', 1.0);

  // Generate metadata about the item - with fallback if it fails
  let metadata: ItemMetadata = {};
  try {
    metadata = await generateItemMetadata(croppedImageUrl, box.label);
    console.log('Generated metadata for:', box.label, metadata);
  } catch (error) {
    console.warn('Failed to generate metadata, using defaults:', error);
    metadata = {
      description: `${box.label} detected in image`,
      condition: 'Unknown',
      resaleValue: 'Not assessed'
    };
  }

  // Create inventory item
  const inventoryItem: InventoryItemType = {
    id: generateUniqueId(),
    imageUrl: croppedImageUrl,
    label: box.label,
    category: box.label.split(' ')[0], // Default category from first word of label
    tags: [box.label], // Default tag from label
    dateAdded: new Date().toISOString(),
    sourceImageUrl: sourceSrc,
    notes: '',
    originalBox: box,
    metadata,
  };
  
  console.log('Created inventory item:', inventoryItem);
  return inventoryItem;
}

export async function saveMaskToInventory(
  box: BoundingBoxMaskType,
  sourceSrc: string | null
): Promise<InventoryItemType> {
  if (!sourceSrc || !box.imageData) {
    throw new Error('Source image and mask data are required');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  // Load the original image and mask
  const image = await loadImage(sourceSrc);
  const maskImage = await loadImage(box.imageData);
  
  // Calculate dimensions in pixels
  const boxWidth = Math.round(box.width * image.width);
  const boxHeight = Math.round(box.height * image.height);
  
  // Set canvas size
  canvas.width = boxWidth;
  canvas.height = boxHeight;
  
  // Clear canvas with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the mask image data to the canvas
  ctx.drawImage(maskImage, 0, 0, boxWidth, boxHeight);
  
  // Convert to data URL with high quality
  const maskedImageUrl = canvas.toDataURL('image/png', 1.0);

  // Generate metadata about the item
  const metadata = await generateItemMetadata(maskedImageUrl, box.label);

  // Create inventory item with more default values
  const inventoryItem: InventoryItemType = {
    id: generateUniqueId(),
    imageUrl: maskedImageUrl,
    label: box.label,
    category: box.label.split(' ')[0], // Default category from first word of label
    tags: [box.label], // Default tag from label
    dateAdded: new Date().toISOString(),
    sourceImageUrl: sourceSrc,
    notes: '',
    originalBox: box,
    metadata,
  };
  
  return inventoryItem;
}
