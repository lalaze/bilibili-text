// services/speechRecognition.ts
// Speech recognition service for generating subtitles using OpenAI Whisper API

import { indexedDBService } from './indexedDBStorage'
import {
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  SpeechRecognitionError,
} from '@/types/speechRecognition'
import { SubtitleSegment } from '@/types/subtitle'

/**
 * SpeechRecognitionService handles audio transcription and subtitle generation
 * Uses OpenAI Whisper API for transcription and IndexedDB for caching
 */
class SpeechRecognitionService {
  /**
   * Check if there's a cached result for the given video ID
   * @param videoId - Video identifier
   * @returns true if cached result exists and is not expired
   */
  async hasCachedResult(videoId: string): Promise<boolean> {
    try {
      const cache = await indexedDBService.loadSubtitleCache(videoId)
      return cache !== null && cache.source === 'speech-recognition'
    } catch (error) {
      console.error('Error checking cache:', error)
      return false
    }
  }

  /**
   * Get cached subtitle result
   * @param videoId - Video identifier
   * @returns Cached subtitles or null if not found/expired
   */
  async getCachedResult(videoId: string): Promise<SubtitleSegment[] | null> {
    try {
      const cache = await indexedDBService.loadSubtitleCache(videoId)
      if (cache && cache.source === 'speech-recognition') {
        return cache.subtitles as SubtitleSegment[]
      }
      return null
    } catch (error) {
      console.error('Error getting cached result:', error)
      return null
    }
  }

  /**
   * Transcribe video audio to generate subtitles
   * Checks cache first, falls back to API call
   * @param options - Transcription options
   * @returns Transcription result with subtitles
   */
  async transcribeVideo(
    options: SpeechRecognitionOptions
  ): Promise<SpeechRecognitionResult> {
    const { videoId, audioUrl, language = 'zh', forceRefresh = false } = options

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.getCachedResult(videoId)
      if (cached) {
        return {
          videoId,
          subtitles: cached,
          source: 'speech-recognition',
          language,
          cached: true,
        }
      }
    }

    // Call API to transcribe
    try {
      const response = await fetch('/api/bilibili/speech/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          audioUrl,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || '语音识别失败'
        const errorDetails = errorData.details || ''
        const fullMessage = errorDetails 
          ? `${errorMessage}\n详细信息: ${errorDetails}`
          : errorMessage
        
        // 对于 501 (NOT_IMPLEMENTED) 或 配置错误，创建一个特殊的错误对象
        // 这些错误不应该被重试
        const error: any = new Error(fullMessage)
        error.code = errorData.error
        error.status = response.status
        error.retryable = response.status !== 501 && response.status !== 500 // 501 和 API配置错误不可重试
        throw error
      }

      const data = await response.json()
      const subtitles = data.subtitles as SubtitleSegment[]

      // Cache the result
      await this.cacheResult(videoId, subtitles, language)

      return {
        videoId,
        subtitles,
        source: 'speech-recognition',
        language,
        cached: false,
      }
    } catch (error) {
      console.error('Error transcribing video:', error)
      throw error
    }
  }

  /**
   * Cache transcription result in IndexedDB
   * @param videoId - Video identifier
   * @param subtitles - Subtitle segments to cache
   * @param language - Subtitle language
   */
  private async cacheResult(
    videoId: string,
    subtitles: SubtitleSegment[],
    language: string
  ): Promise<void> {
    try {
      await indexedDBService.saveSubtitleCache({
        videoId,
        subtitles,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        source: 'speech-recognition',
        language,
      })
    } catch (error) {
      // Don't fail the whole operation if caching fails
      console.error('Failed to cache transcription result:', error)
    }
  }

  /**
   * Clear cached result for a video
   * @param videoId - Video identifier
   */
  async clearCache(videoId: string): Promise<void> {
    try {
      await indexedDBService.clearVideoCache(videoId)
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Check transcription status
   * (Placeholder for future polling implementation)
   * @param videoId - Video identifier
   * @returns Task status
   */
  async checkStatus(videoId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    error?: string
  }> {
    // For now, this is a simple implementation
    // In the future, this could poll a background job
    const hasCached = await this.hasCachedResult(videoId)

    return {
      status: hasCached ? 'completed' : 'pending',
      progress: hasCached ? 100 : 0,
    }
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService()

