// components/SpeechRecognitionStatus.tsx
// Display speech recognition progress and status

import React from 'react'

export interface SpeechRecognitionStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  error?: string
}

export default function SpeechRecognitionStatus({
  status,
  progress,
  error,
}: SpeechRecognitionStatusProps) {
  const statusMessages = {
    pending: '准备开始语音识别...',
    processing: '正在生成字幕...',
    completed: '字幕生成完成',
    failed: '字幕生成失败',
  }

  const statusColors = {
    pending: 'bg-gray-200',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  }

  return (
    <div
      className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          )}
          {status === 'completed' && (
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {status === 'failed' && (
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          <span className="font-medium text-gray-900">
            {statusMessages[status]}
          </span>
        </div>
        {status === 'processing' && (
          <span className="text-sm text-gray-600">{progress}%</span>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'processing' || status === 'pending') && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${statusColors[status]}`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {/* Error message */}
      {status === 'failed' && error && (
        <div className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Helper text */}
      {status === 'processing' && (
        <p className="mt-2 text-xs text-gray-500">
          这可能需要几分钟时间，取决于视频长度
        </p>
      )}

      {status === 'completed' && (
        <p className="mt-2 text-xs text-gray-500">
          字幕已缓存，下次加载将更快
        </p>
      )}
    </div>
  )
}

