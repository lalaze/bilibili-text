// hooks/useSubtitleSync.ts
// Hook for synchronizing active subtitle with playback

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { SubtitleSegment } from '@/types/subtitle'
import { findActiveSubtitle } from '@/services/subtitleParser'

interface UseSubtitleSyncReturn {
  activeSegmentId: string | null
  scrollToActive: () => void
}

export function useSubtitleSync(
  currentTime: number,
  subtitles: SubtitleSegment[]
): UseSubtitleSyncReturn {
  const previousActiveId = useRef<string | null>(null)

  // Compute active segment based on current time
  // Memoized to avoid recalculation on every render
  const activeSegment = useMemo(() => {
    return findActiveSubtitle(currentTime, subtitles)
  }, [currentTime, subtitles])

  const activeSegmentId = activeSegment?.id || null

  // Scroll to active segment helper
  const scrollToActive = useCallback(() => {
    if (activeSegmentId) {
      const element = document.querySelector(`[data-segment-id="${activeSegmentId}"]`)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [activeSegmentId])

  // Auto-scroll when active segment changes
  useEffect(() => {
    if (activeSegmentId && activeSegmentId !== previousActiveId.current) {
      previousActiveId.current = activeSegmentId
      scrollToActive()
    }
  }, [activeSegmentId, scrollToActive])

  return {
    activeSegmentId,
    scrollToActive,
  }
}

