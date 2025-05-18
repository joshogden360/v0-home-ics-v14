"use client"

import { useEffect, useRef } from "react"
import DOMPurify from "dompurify"

export function DocumentContent({ content }: { content: string | null }) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && content) {
      // Sanitize the HTML content to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(content)
      contentRef.current.innerHTML = sanitizedContent
    }
  }, [content])

  if (!content) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No content available for this document.</p>
      </div>
    )
  }

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
      <div ref={contentRef} />
    </div>
  )
}
