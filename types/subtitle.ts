// types/subtitle.ts
// SubtitleSegment represents an individual subtitle entry with timing and text

export interface SubtitleSegment {
  id: string // Unique segment identifier (format: subtitle-{index})
  videoId: string // Reference to parent video
  startTime: number // Start timestamp in seconds
  endTime: number // End timestamp in seconds
  text: string // Subtitle text content
  index: number // Sequential position in subtitle list
  language?: string // Subtitle language code (ISO 639-1)
}

export interface SubtitleTrack {
  lang: string // Language code
  langDoc: string // Language display name
  url: string // Subtitle file URL
}

export interface SubtitleData {
  videoId: string
  tracks: SubtitleTrack[]
  subtitles: SubtitleSegment[]
}

export type SubtitleError =
  | 'NO_SUBTITLES'
  | 'SUBTITLE_FETCH_FAILED'
  | 'SUBTITLE_PARSE_ERROR'
  | 'INVALID_PARAMS'

