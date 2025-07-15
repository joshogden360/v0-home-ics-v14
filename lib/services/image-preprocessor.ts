/**
 * Image Pre-processor Service
 * Handles image orientation, quality enhancement, and optimization for AI analysis
 */

interface ImageMetadata {
  width: number
  height: number
  orientation?: number
  quality: 'high' | 'medium' | 'low'
  fileSize: number
  format: string
  needsRotation: boolean
  rotationAngle: number
}

interface ProcessedImage {
  dataUrl: string
  metadata: ImageMetadata
  optimized: boolean
}

export class ImagePreprocessor {
  private readonly MAX_SIZE = 1024 // Optimal size for Gemini API
  private readonly QUALITY_THRESHOLD = 0.85
  
  /**
   * Process an image file for optimal AI analysis
   */
  async processImage(file: File): Promise<ProcessedImage> {
    // Extract metadata first
    const metadata = await this.extractMetadata(file)
    
    // Read and process the image
    const img = await this.loadImage(file)
    
    // Fix orientation if needed
    const correctedImg = metadata.needsRotation 
      ? await this.correctOrientation(img, metadata.rotationAngle)
      : img
    
    // Optimize for AI analysis
    const optimized = await this.optimizeForAI(correctedImg, metadata)
    
    return optimized
  }

  /**
   * Extract EXIF and image metadata
   */
  private async extractMetadata(file: File): Promise<ImageMetadata> {
    const arrayBuffer = await file.arrayBuffer()
    const orientation = await this.getExifOrientation(arrayBuffer)
    
    // Load image to get dimensions
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    return new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          orientation,
          quality: this.assessQuality(img.width, img.height, file.size),
          fileSize: file.size,
          format: file.type,
          needsRotation: orientation !== 1 && orientation !== undefined,
          rotationAngle: this.getRotationAngle(orientation)
        }
        
        resolve(metadata)
      }
      
      img.src = url
    })
  }

  /**
   * Get EXIF orientation from image data
   * Based on the reference document's TIFF orientation detection
   */
  private async getExifOrientation(arrayBuffer: ArrayBuffer): Promise<number | undefined> {
    const view = new DataView(arrayBuffer)
    
    // Check for JPEG
    if (view.getUint16(0) !== 0xFFD8) {
      return undefined
    }
    
    let offset = 2
    let marker
    
    while (offset < view.byteLength) {
      marker = view.getUint16(offset)
      
      // Found EXIF marker
      if (marker === 0xFFE1) {
        const exifLength = view.getUint16(offset + 2)
        const exifData = new DataView(arrayBuffer, offset + 4, exifLength - 2)
        
        // Check for "Exif\0\0"
        if (exifData.getUint32(0) === 0x45786966 && exifData.getUint16(4) === 0x0000) {
          // TIFF header starts at offset 6
          const tiffStart = 6
          
          // Determine endianness
          const endian = exifData.getUint16(tiffStart)
          const isLittleEndian = (endian === 0x4949) // 'II' in ASCII
          
          // Verify TIFF header
          const tiffMagic = exifData.getUint16(tiffStart + 2, isLittleEndian)
          if (tiffMagic !== 42) {
            return undefined
          }
          
          // Get IFD offset
          const ifdOffset = exifData.getUint32(tiffStart + 4, isLittleEndian)
          const ifdStart = tiffStart + ifdOffset
          
          // Read IFD entries
          const numEntries = exifData.getUint16(ifdStart, isLittleEndian)
          
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdStart + 2 + (i * 12)
            const tag = exifData.getUint16(entryOffset, isLittleEndian)
            
            // Orientation tag is 0x0112
            if (tag === 0x0112) {
              const type = exifData.getUint16(entryOffset + 2, isLittleEndian)
              const count = exifData.getUint32(entryOffset + 4, isLittleEndian)
              
              if (type === 3 && count === 1) { // SHORT type
                return exifData.getUint16(entryOffset + 8, isLittleEndian)
              }
            }
          }
        }
        
        break
      }
      
      // Skip to next marker
      if (marker >= 0xFFE0 && marker <= 0xFFEF) {
        offset += 2 + view.getUint16(offset + 2)
      } else {
        offset += 2
      }
    }
    
    return undefined
  }

  /**
   * Convert EXIF orientation to rotation angle
   */
  private getRotationAngle(orientation?: number): number {
    switch (orientation) {
      case 3: return 180
      case 6: return 90
      case 8: return 270
      default: return 0
    }
  }

  /**
   * Assess image quality based on dimensions and file size
   */
  private assessQuality(width: number, height: number, fileSize: number): 'high' | 'medium' | 'low' {
    const pixels = width * height
    const compressionRatio = fileSize / pixels
    
    if (pixels < 500000 || compressionRatio < 0.5) {
      return 'low'
    } else if (pixels < 2000000 || compressionRatio < 1) {
      return 'medium'
    }
    
    return 'high'
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  /**
   * Correct image orientation using canvas
   * This fixes the iPhone orientation issue mentioned in the reference
   */
  private async correctOrientation(
    img: HTMLImageElement, 
    rotationAngle: number
  ): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Set canvas size based on rotation
    if (rotationAngle === 90 || rotationAngle === 270) {
      canvas.width = img.height
      canvas.height = img.width
    } else {
      canvas.width = img.width
      canvas.height = img.height
    }
    
    // Rotate and draw
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotationAngle * Math.PI) / 180)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    ctx.restore()
    
    // Convert back to image
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const correctedImg = new Image()
        correctedImg.onload = () => resolve(correctedImg)
        correctedImg.src = URL.createObjectURL(blob!)
      }, 'image/jpeg', 0.95)
    })
  }

  /**
   * Optimize image for AI analysis
   */
  private async optimizeForAI(
    img: HTMLImageElement, 
    metadata: ImageMetadata
  ): Promise<ProcessedImage> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Calculate optimal dimensions
    const scale = Math.min(this.MAX_SIZE / img.width, this.MAX_SIZE / img.height, 1)
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Apply quality enhancements for low-quality images
    if (metadata.quality === 'low') {
      // Sharpen filter for low quality images
      ctx.filter = 'contrast(1.1) brightness(1.05)'
    }
    
    // Draw the image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    // Convert to data URL with appropriate quality
    const quality = metadata.quality === 'low' ? 0.95 : 0.9
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    
    return {
      dataUrl,
      metadata: {
        ...metadata,
        width: canvas.width,
        height: canvas.height
      },
      optimized: true
    }
  }

  /**
   * Generate optimal prompt based on image characteristics
   */
  generateOptimalPrompt(metadata: ImageMetadata, userPrompt?: string): string {
    const basePrompt = userPrompt || 'household items, furniture, electronics, books, kitchen items, decorative items'
    
    let enhancedPrompt = `Detect ${basePrompt} in this image.`
    
    // Add quality-specific instructions
    if (metadata.quality === 'low') {
      enhancedPrompt += ' The image may be low quality, so focus on larger, clearly visible items.'
    }
    
    // Add size-specific instructions
    const aspectRatio = metadata.width / metadata.height
    if (aspectRatio > 1.5) {
      enhancedPrompt += ' This is a wide/panoramic image, scan the entire width carefully.'
    } else if (aspectRatio < 0.67) {
      enhancedPrompt += ' This is a tall/portrait image, scan the entire height carefully.'
    }
    
    enhancedPrompt += `
    
Output ONLY a valid JSON array where each entry is an object with exactly two fields:
- "box_2d": an array of 4 numbers [ymin, xmin, ymax, xmax] as percentages of image dimensions from 0 to 1000
- "label": a string with a descriptive label that includes the item type and any visible brand names or distinguishing features

Focus on individual items that someone would want to catalog. Return ONLY the JSON array, no other text.`
    
    return enhancedPrompt
  }

  /**
   * Batch process multiple images
   */
  async processBatch(files: File[]): Promise<ProcessedImage[]> {
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 3
    const results: ProcessedImage[] = []
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(file => this.processImage(file))
      )
      results.push(...batchResults)
    }
    
    return results
  }
} 