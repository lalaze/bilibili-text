'use client'

// components/SubtitleDisplay.tsx
// Subtitle list display with virtualization

import { useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { SubtitleSegment as SubtitleSegmentType } from '@/types/subtitle'
import SubtitleSegment from './SubtitleSegment'

interface SubtitleDisplayProps {
  subtitles: SubtitleSegmentType[]
  activeSegmentId: string | null
  highlightedSegmentIds: Set<string>
  onSegmentClick: (segmentId: string) => void
  className?: string
}

export default function SubtitleDisplay({
  subtitles,
  activeSegmentId,
  highlightedSegmentIds,
  onSegmentClick,
  className = '',
}: SubtitleDisplayProps) {
  const listRef = useRef<List>(null)

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentId && listRef.current) {
      const activeIndex = subtitles.findIndex((s) => s.id === activeSegmentId)
      if (activeIndex !== -1) {
        listRef.current.scrollToItem(activeIndex, 'smart')
      }
    }
  }, [activeSegmentId, subtitles])

  if (subtitles.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">没有字幕</p>
          <p className="text-sm mt-1">该视频暂无字幕数据</p>
        </div>
      </div>
    )
  }

  // Use virtualization for large lists (>50 items)
  const useVirtualization = subtitles.length > 50

  if (useVirtualization) {
    const Row = ({ index, style }: { index: number; style: any }) => {
      const segment = subtitles[index]
      const isActive = segment.id === activeSegmentId
      const isHighlighted = highlightedSegmentIds.has(segment.id)

      return (
        <div style={style}>
          <SubtitleSegment
            segment={segment}
            isActive={isActive}
            isHighlighted={isHighlighted}
            onClick={onSegmentClick}
          />
        </div>
      )
    }

    return (
      <div
        role="region"
        aria-label="视频字幕列表"
        className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      >
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">字幕</h2>
          <p className="text-sm text-gray-600 mt-1">
            共 {subtitles.length} 条 · 点击字幕可标记高亮
          </p>
        </div>

        <List
          ref={listRef}
          height={600}
          itemCount={subtitles.length}
          itemSize={100}
          width="100%"
          className="custom-scrollbar"
        >
          {Row}
        </List>
      </div>
    )
  }

  // Regular rendering for small lists
  return (
    <div
      role="region"
      aria-label="视频字幕列表"
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
    >
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">字幕</h2>
        <p className="text-sm text-gray-600 mt-1">
          共 {subtitles.length} 条 · 点击字幕可标记高亮
        </p>
      </div>

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {subtitles.map((segment) => {
          const isActive = segment.id === activeSegmentId
          const isHighlighted = highlightedSegmentIds.has(segment.id)

          return (
            <SubtitleSegment
              key={segment.id}
              segment={segment}
              isActive={isActive}
              isHighlighted={isHighlighted}
              onClick={onSegmentClick}
            />
          )
        })}
      </div>
    </div>
  )
}

