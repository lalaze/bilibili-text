'use client'

// components/SubtitleSegment.tsx
// Individual subtitle segment component

import { memo, KeyboardEvent } from 'react'
import { SubtitleSegment as SubtitleSegmentType } from '@/types/subtitle'
import { formatTime, cn } from '@/lib/utils'

interface SubtitleSegmentProps {
  segment: SubtitleSegmentType
  isActive: boolean
  isHighlighted: boolean
  onClick: (segmentId: string) => void
  className?: string
}

const SubtitleSegment = memo<SubtitleSegmentProps>(function SubtitleSegment({
  segment,
  isActive,
  isHighlighted,
  onClick,
  className = '',
}) {
  const handleClick = () => {
    onClick(segment.id)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(segment.id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'subtitle-segment',
        'p-4 cursor-pointer transition-all duration-200',
        'border-b border-gray-100 last:border-b-0',
        'hover:bg-gray-50',
        isActive && 'subtitle-segment--active bg-yellow-200',
        isHighlighted && 'subtitle-segment--highlighted border-l-4 border-blue-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
    >
      {/* Timing */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
        <span>{formatTime(segment.startTime)}</span>
        <span>→</span>
        <span>{formatTime(segment.endTime)}</span>
        {isHighlighted && (
          <span className="ml-auto text-blue-600 font-medium">已标记</span>
        )}
      </div>

      {/* Text */}
      <p
        className={cn(
          'text-base leading-relaxed',
          isActive ? 'text-gray-900 font-medium' : 'text-gray-700'
        )}
      >
        {segment.text}
      </p>

      {/* Index indicator */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">#{segment.index + 1}</span>
        {isActive && (
          <span className="text-xs text-yellow-700 font-medium">正在播放</span>
        )}
      </div>
    </div>
  )
})

export default SubtitleSegment

