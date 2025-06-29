import { Metadata } from 'next'
import { ImageAnalyzer } from '@/components/ai/image-analyzer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Brain, Camera, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Item Analysis - The Itemizer',
  description: 'Use AI to automatically detect and catalog items from photos',
}

export default function AIAnalysisPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Item Analysis</h1>
            <p className="text-muted-foreground">
              Transform your photos into organized inventory with the power of AI
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Camera className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Smart Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically identify furniture, electronics, and household items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Instant Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get detailed item information in seconds, not hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Rich Metadata</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic categorization, descriptions, and estimated values
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main AI Analyzer Component */}
      <ImageAnalyzer
        onItemsDetected={(items) => {
          console.log('Items detected:', items)
        }}
        onItemSelected={(item) => {
          console.log('Item selected:', item)
        }}
      />

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How AI Analysis Works
          </CardTitle>
          <CardDescription>
            Our advanced AI system powered by Google Gemini analyzes your photos to identify household items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Photo</h4>
              <p className="text-sm text-muted-foreground">
                Take a new photo or upload an existing image of your room or items
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our AI identifies individual items and creates precise bounding boxes
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Review & Select</h4>
              <p className="text-sm text-muted-foreground">
                Review detected items, adjust selections, and add detailed information
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 dark:text-orange-400 font-bold">4</span>
              </div>
              <h4 className="font-semibold mb-2">Add to Inventory</h4>
              <p className="text-sm text-muted-foreground">
                Save selected items to your inventory with rich metadata and categorization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
          <CardDescription>
            Follow these guidelines to get the most accurate AI detection results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">✓ Do This</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Use good lighting - natural light works best
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Take photos from a comfortable distance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Ensure items are clearly visible and not obscured
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Include multiple items in one photo for batch processing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Use high-resolution images when possible
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-red-600 dark:text-red-400">✗ Avoid This</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Blurry or out-of-focus images
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Extreme close-ups that don't show the full item
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Photos with heavy shadows or backlighting
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Cluttered scenes where items overlap significantly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Images larger than 10MB (they'll be resized automatically)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 