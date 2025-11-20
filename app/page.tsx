'use client'

// app/page.tsx
// Home page with URL input

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoUrlInput from '@/components/VideoUrlInput'
import ErrorMessage from '@/components/ErrorMessage'
import { AppError } from '@/types/errors'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const handleSubmit = async (videoId: string, _url: string) => {
    // Note: URL validation is handled by VideoUrlInput component
    setIsLoading(true)
    setError(null)

    try {
      // Navigate to video page
      router.push(`/video/${videoId}`)
    } catch (err) {
      setError('FETCH_FAILED')
      setIsLoading(false)
    }
  }

  const handleError = (_errorMsg: string) => {
    setError('INVALID_VIDEO_ID')
  }

  const handleDismissError = () => {
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Bilibili 字幕同步
            </h1>
            <p className="text-lg text-gray-600">
              播放视频并高亮显示当前字幕
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <ErrorMessage error={error} onDismiss={handleDismissError} />
            </div>
          )}

          {/* URL Input Form */}
          <VideoUrlInput
            onSubmit={handleSubmit}
            onError={handleError}
            isLoading={isLoading}
          />

          {/* Features */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">功能特点</h2>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">视频播放时自动高亮当前字幕</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">点击字幕段落手动标记高亮</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">高亮标记自动保存到浏览器</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>支持带字幕的 Bilibili 视频</p>
        </div>
      </div>
    </div>
  )
}

