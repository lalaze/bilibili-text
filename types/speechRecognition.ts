// types/speechRecognition.ts
// Types for speech recognition and subtitle caching

export interface SpeechRecognitionTask {
  videoId: string // Video identifier
  status: 'pending' | 'processing' | 'completed' | 'failed' // Task status
  progress: number // Progress percentage (0-100)
  startedAt: number // Timestamp when task started
  completedAt?: number // Timestamp when task completed
  error?: string // Error message if failed
}

export interface SubtitleCache {
  videoId: string // Video identifier
  subtitles: any[] // Cached subtitle segments (use SubtitleSegment[] type)
  cachedAt: number // Timestamp when cached
  expiresAt: number // Expiration timestamp (TTL: 30 days)
  source: 'native' | 'speech-recognition' // Subtitle source
  language: string // Subtitle language
}

export interface SpeechRecognitionOptions {
  videoId: string
  audioUrl: string
  language?: string // Target language (default: 'zh')
  forceRefresh?: boolean // Skip cache and force new transcription
}

export interface SpeechRecognitionResult {
  videoId: string
  subtitles: any[] // Array of SubtitleSegment
  source: 'speech-recognition'
  language: string
  cached: boolean // Whether result was from cache
}

export type SpeechRecognitionError =
  | 'AUDIO_EXTRACTION_FAILED'
  | 'AUDIO_TOO_LARGE'
  | 'API_ERROR'
  | 'TRANSCRIPTION_FAILED'
  | 'INVALID_VIDEO_ID'
  | 'CACHE_ERROR'

