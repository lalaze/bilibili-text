// hooks/useHighlights.ts
// Hook for managing user highlight persistence

import { useState, useEffect, useCallback } from 'react'
import { StorageService } from '@/services/storage'
import { UserHighlight } from '@/types/highlight'
import { generateId } from '@/lib/utils'

interface UseHighlightsReturn {
  highlights: Set<string>
  toggleHighlight: (segmentId: string) => void
  clearHighlights: () => void
  isHighlighted: (segmentId: string) => boolean
  highlightCount: number
}

export function useHighlights(videoId: string): UseHighlightsReturn {
  const [highlights, setHighlights] = useState<Set<string>>(new Set())
  const [storageService] = useState(() => new StorageService())

  // Load highlights from localStorage on mount
  useEffect(() => {
    if (!videoId) return

    try {
      const savedHighlights = storageService.loadHighlights(videoId)
      const highlightIds = new Set(savedHighlights.map((h) => h.segmentId))
      setHighlights(highlightIds)
    } catch (error) {
      console.error('Failed to load highlights:', error)
    }
  }, [videoId, storageService])

  // Save highlights to localStorage whenever they change
  useEffect(() => {
    if (!videoId) return

    try {
      const highlightArray: UserHighlight[] = Array.from(highlights).map(
        (segmentId) => ({
          id: generateId(),
          videoId,
          segmentId,
          createdAt: new Date(),
        })
      )

      storageService.saveHighlights(videoId, highlightArray)
    } catch (error: any) {
      console.error('Failed to save highlights:', error)
      
      // Handle quota exceeded error
      if (error.code === 'QUOTA_EXCEEDED') {
        alert('存储空间已满，请清理浏览器缓存或删除一些高亮标记')
      }
    }
  }, [highlights, videoId, storageService])

  const toggleHighlight = useCallback((segmentId: string) => {
    setHighlights((prev) => {
      const newHighlights = new Set(prev)
      if (newHighlights.has(segmentId)) {
        newHighlights.delete(segmentId)
      } else {
        newHighlights.add(segmentId)
      }
      return newHighlights
    })
  }, [])

  const clearHighlights = useCallback(() => {
    setHighlights(new Set())
    if (videoId) {
      storageService.clearHighlights(videoId)
    }
  }, [videoId, storageService])

  const isHighlighted = useCallback(
    (segmentId: string) => {
      return highlights.has(segmentId)
    },
    [highlights]
  )

  return {
    highlights,
    toggleHighlight,
    clearHighlights,
    isHighlighted,
    highlightCount: highlights.size,
  }
}

