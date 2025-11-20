// types/playback.ts
// PlaybackState represents current video playback state (ephemeral, not persisted)

export interface PlaybackState {
  videoId: string // Current video ID
  currentTime: number // Current playback position in seconds
  isPlaying: boolean // Whether video is currently playing
  activeSegmentId: string | null // Currently highlighted segment
  playbackRate?: number // Playback speed multiplier (0.25 to 2.0)
  volume?: number // Volume level (0.0 to 1.0)
}

export type PlaybackStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'ENDED'

