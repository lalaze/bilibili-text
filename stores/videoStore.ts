// stores/videoStore.ts
// Global state management using Zustand

import { create } from 'zustand'
import { SubtitleSegment } from '@/types/subtitle'
import { AppError } from '@/types/errors'

interface VideoStore {
  // State
  videoId: string | null
  currentTime: number
  isPlaying: boolean
  duration: number
  subtitles: SubtitleSegment[]
  highlights: Set<string>
  activeSegmentId: string | null
  error: AppError | null

  // Actions
  setVideoId: (id: string) => void
  updateTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setDuration: (duration: number) => void
  loadSubtitles: (subtitles: SubtitleSegment[]) => void
  toggleHighlight: (segmentId: string) => void
  setHighlights: (highlights: Set<string>) => void
  setActiveSegment: (id: string | null) => void
  setError: (error: AppError | null) => void
  reset: () => void
}

const initialState = {
  videoId: null,
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  subtitles: [],
  highlights: new Set<string>(),
  activeSegmentId: null,
  error: null,
}

export const useVideoStore = create<VideoStore>((set) => ({
  ...initialState,

  setVideoId: (id) => set({ videoId: id }),

  updateTime: (time) => set({ currentTime: time }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setDuration: (duration) => set({ duration }),

  loadSubtitles: (subtitles) => set({ subtitles }),

  toggleHighlight: (segmentId) =>
    set((state) => {
      const newHighlights = new Set(state.highlights)
      if (newHighlights.has(segmentId)) {
        newHighlights.delete(segmentId)
      } else {
        newHighlights.add(segmentId)
      }
      return { highlights: newHighlights }
    }),

  setHighlights: (highlights) => set({ highlights }),

  setActiveSegment: (id) => set({ activeSegmentId: id }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))

