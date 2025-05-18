import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get("text") || "Image"
  const width = Number.parseInt(searchParams.get("width") || "300")
  const height = Number.parseInt(searchParams.get("height") || "300")
  const bgColor = searchParams.get("bg") || "#f0f0f0"
  const textColor = searchParams.get("color") || "#333333"

  // Create an SVG placeholder with the given text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        text-anchor="middle" 
        dominant-baseline="middle"
        fill="${textColor}"
      >
        ${text}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
