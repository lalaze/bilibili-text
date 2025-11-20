'use client'

// components/ErrorMessage.tsx
// Error display component with proper ARIA attributes

import { AppError, ERROR_MESSAGES } from '@/types/errors'

interface ErrorMessageProps {
  error: AppError | null
  onDismiss?: () => void
  className?: string
}

export default function ErrorMessage({
  error,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  if (!error) {
    return null
  }

  const message = ERROR_MESSAGES[error] || '发生未知错误'

  // Determine error severity for styling
  const isWarning = error === 'NO_SUBTITLES'
  const isCritical = error === 'FETCH_FAILED' || error === 'VIDEO_RESTRICTED'

  const bgColor = isWarning
    ? 'bg-yellow-50 border-yellow-400'
    : isCritical
      ? 'bg-red-50 border-red-400'
      : 'bg-blue-50 border-blue-400'

  const textColor = isWarning
    ? 'text-yellow-800'
    : isCritical
      ? 'text-red-800'
      : 'text-blue-800'

  const icon = isWarning ? '⚠️' : isCritical ? '❌' : 'ℹ️'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${bgColor} ${textColor} border-l-4 p-4 rounded-md shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
          <div>
            <p className="font-medium">{message}</p>
            <p className="text-sm mt-1 opacity-80">错误代码: {error}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${textColor} hover:opacity-70 transition-opacity ml-4`}
            aria-label="关闭错误提示"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

