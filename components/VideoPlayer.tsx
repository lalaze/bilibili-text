'use client'

// components/VideoPlayer.tsx
// Bilibili video player embed wrapper

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoId: string
  embedUrl: string
  onTimeUpdate: (currentTime: number) => void
  onPlayStateChange: (isPlaying: boolean) => void
  onError: (error: any) => void
  className?: string
}

export default function VideoPlayer({
  videoId,
  embedUrl,
  onTimeUpdate: _onTimeUpdate,
  onPlayStateChange: _onPlayStateChange,
  onError,
  className = '',
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // TODO: Implement iframe communication to track time and play state
  // Currently these callbacks are not used because Bilibili iframe doesn't expose events

  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
  }, [videoId])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError(new Error('Video player failed to load'))
  }

  // Note: Bilibili iframe doesn't provide direct time update events
  // Time tracking would need to be done through postMessage API or
  // alternative approaches if Bilibili provides such functionality
  // For now, this is a basic implementation

  return (
    <div className={`relative w-full ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">加载视频中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center p-6">
            <svg
              className="h-12 w-12 text-red-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 font-medium">视频加载失败</p>
            <p className="text-red-600 text-sm mt-1">请检查视频URL或稍后重试</p>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div
        className="relative w-full"
        style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}
      >
        <iframe
          src={embedUrl}
          title="Bilibili 视频播放器"
          aria-label="Bilibili视频播放器"
          onLoad={handleLoad}
          onError={handleError}
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
      </div>
    </div>
  )
}

