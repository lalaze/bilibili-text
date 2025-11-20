'use client'

// components/VideoUrlInput.tsx
// Form for entering and validating Bilibili video URLs

import { useState, FormEvent, ChangeEvent, KeyboardEvent } from 'react'
import { extractVideoId, isValidBilibiliUrl } from '@/lib/utils'

interface VideoUrlInputProps {
  onSubmit: (videoId: string, url: string) => void
  onError: (error: string) => void
  isLoading?: boolean
  className?: string
}

export default function VideoUrlInput({
  onSubmit,
  onError,
  isLoading = false,
  className = '',
}: VideoUrlInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const validateAndSubmit = () => {
    // Validate URL
    if (!url.trim()) {
      const errorMsg = '请输入Bilibili视频URL'
      setError(errorMsg)
      onError(errorMsg)
      return
    }

    if (!isValidBilibiliUrl(url)) {
      const errorMsg = '请输入有效的Bilibili视频URL（格式：https://www.bilibili.com/video/BV...）'
      setError(errorMsg)
      onError(errorMsg)
      return
    }

    const videoId = extractVideoId(url)

    if (!videoId) {
      const errorMsg = '无法从URL中提取视频ID'
      setError(errorMsg)
      onError(errorMsg)
      return
    }

    // Clear error and submit
    setError('')
    onSubmit(videoId, url)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    validateAndSubmit()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateAndSubmit()
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="video-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Bilibili 视频 URL
          </label>
          <input
            id="video-url"
            type="url"
            value={url}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="https://www.bilibili.com/video/BV..."
            required
            disabled={isLoading}
            aria-label="Bilibili视频URL输入框"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
            className={`
              w-full px-4 py-3 rounded-lg border
              ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              focus:outline-none focus:ring-2 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors
            `}
          />
          {error && (
            <p
              id="url-error"
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }
            text-white shadow-md hover:shadow-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
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
              <span>加载中...</span>
            </span>
          ) : (
            '加载视频'
          )}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium mb-1">支持的URL格式：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>https://www.bilibili.com/video/BV1xx411c7mD</li>
          <li>https://www.bilibili.com/video/av12345</li>
        </ul>
      </div>
    </div>
  )
}

