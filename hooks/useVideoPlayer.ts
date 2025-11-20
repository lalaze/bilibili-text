// hooks/useVideoPlayer.ts
// Hook for managing video playback state

import { useEffect, useCallback } from 'react'
import { useVideoStore } from '@/stores/videoStore'
import { debounce } from '@/lib/utils'

interface UseVideoPlayerReturn {
  currentTime: number
  isPlaying: boolean
  duration: number
  setCurrentTime: (time: number) => void
  togglePlay: () => void
  seek: (time: number) => void
}

export function useVideoPlayer(videoId: string): UseVideoPlayerReturn {
  const {
    currentTime,
    isPlaying,
    duration,
    updateTime,
    setPlaying,
    setDuration,
  } = useVideoStore()

  // Debounced time update to avoid excessive re-renders
  const debouncedUpdateTime = useCallback(
    debounce((time: number) => {
      updateTime(time)
    }, 100),
    []
  )

  const setCurrentTime = useCallback(
    (time: number) => {
      debouncedUpdateTime(time)
    },
    [debouncedUpdateTime]
  )

  const togglePlay = useCallback(() => {
    setPlaying(!isPlaying)
  }, [isPlaying, setPlaying])

  const seek = useCallback(
    (time: number) => {
      updateTime(time)
    },
    [updateTime]
  )

  return {
    currentTime,
    isPlaying,
    duration,
    setCurrentTime,
    togglePlay,
    seek,
  }
}

