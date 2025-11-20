// types/video.ts
// Video entity represents a Bilibili video with metadata and playback state

export interface Video {
  id: string // Bilibili video ID (BV or AV format)
  url: string // Full Bilibili video URL
  title?: string // Video title (fetched from API)
  duration?: number // Video duration in seconds
  cid?: string // Content ID (required for subtitle fetch)
  embedUrl: string // Iframe embed URL
  loadedAt: Date // Timestamp when video was loaded
}

export type VideoError =
  | 'VIDEO_NOT_FOUND'
  | 'VIDEO_RESTRICTED'
  | 'EMBED_BLOCKED'
  | 'INVALID_VIDEO_ID'
  | 'FETCH_FAILED'

