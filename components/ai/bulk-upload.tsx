"use client"

import { useState, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { aiService } from '@/lib/services/ai-service'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface BulkUploadProps {
  onComplete?: (results: any[]) => void
  className?: string
}

interface FileStatus {
  file: File
  status: 'pending' | 'processing' | 'complete' | 'error'
  result?: any
  error?: string
}

export function BulkUpload({ onComplete, className }: BulkUploadProps) {
  const [files, setFiles] = useState<FileStatus[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((newFiles: FileList) => {
    const fileStatuses: FileStatus[] = Array.from(newFiles).map(file => ({
      file,
      status: 'pending' as const
    }))
    setFiles(prev => [...prev, ...fileStatuses])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const processFiles = async () => {
    setIsProcessing(true)
    const results: any[] = []

    // Process files sequentially to avoid overwhelming the API
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ))

      try {
        const result = await aiService.analyzeImage(files[i].file)
        results.push(result)
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'complete', result } : f
        ))
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Failed'
          } : f
        ))
      }
    }

    setIsProcessing(false)
    onComplete?.(results)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const completedCount = files.filter(f => f.status === 'complete').length
  const totalCount = files.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-colors",
          "flex flex-col items-center justify-center min-h-[200px]",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drop images here</p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">
              {totalCount} file{totalCount !== 1 ? 's' : ''} • {completedCount} processed
            </h3>
            {!isProcessing && files.some(f => f.status === 'pending') && (
              <button
                onClick={processFiles}
                className="text-sm font-medium text-primary hover:underline"
              >
                Process All
              </button>
            )}
          </div>

          {isProcessing && (
            <Progress value={progress} className="h-1 mb-2" />
          )}

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {files.map((fileStatus, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md",
                  "bg-muted/50 hover:bg-muted transition-colors"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {fileStatus.status === 'pending' && (
                    <div className="h-4 w-4 rounded-full bg-muted-foreground/25" />
                  )}
                  {fileStatus.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {fileStatus.status === 'complete' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {fileStatus.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileStatus.file.name}
                  </p>
                  {fileStatus.status === 'complete' && fileStatus.result && (
                    <p className="text-xs text-muted-foreground">
                      {fileStatus.result.totalItemsDetected} items detected
                    </p>
                  )}
                  {fileStatus.status === 'error' && (
                    <p className="text-xs text-destructive">
                      {fileStatus.error}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 p-1 hover:bg-background rounded"
                  disabled={fileStatus.status === 'processing'}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 