// hooks/useSubtitles.ts
// Hook for fetching and managing subtitle data with speech recognition fallback

import { useState, useEffect } from 'react'
import { SubtitleSegment } from '@/types/subtitle'
import { SubtitleError } from '@/types/subtitle'
import { BilibiliService } from '@/services/bilibili'
import { speechRecognitionService } from '@/services/speechRecognition'

interface UseSubtitlesReturn {
  subtitles: SubtitleSegment[]
  isLoading: boolean
  error: SubtitleError | null
  isSpeechRecognition: boolean
  speechRecognitionStatus:
    | 'idle'
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
  speechRecognitionProgress: number
  refetch: () => Promise<void>
}

export function useSubtitles(
  videoId: string | null,
  cid: string | null
): UseSubtitlesReturn {
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<SubtitleError | null>(null)
  const [isSpeechRecognition, setIsSpeechRecognition] = useState(false)
  const [speechRecognitionStatus, setSpeechRecognitionStatus] = useState<
    'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  >('idle')
  const [speechRecognitionProgress, setSpeechRecognitionProgress] = useState(0)

  const fetchSubtitles = async () => {
    if (!videoId || !cid) {
      return
    }

    setIsLoading(true)
    setError(null)
    setIsSpeechRecognition(false)
    setSpeechRecognitionStatus('idle')
    setSpeechRecognitionProgress(0)

    try {
      // Try to fetch native subtitles first
      const service = new BilibiliService()
      const subtitleData = await service.fetchSubtitles(videoId, cid)
      setSubtitles(subtitleData.subtitles)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Failed to fetch native subtitles:', err)

      // If no native subtitles, fall back to speech recognition
      if (err.code === 'NO_SUBTITLES') {
        await fallbackToSpeechRecognition(videoId)
      } else {
        // For other errors, set error state
        if (err.code) {
          setError(err.code as SubtitleError)
        } else {
          setError('SUBTITLE_FETCH_FAILED')
        }
        setSubtitles([])
        setIsLoading(false)
      }
    }
  }

  const fallbackToSpeechRecognition = async (videoId: string) => {
    try {
      setIsSpeechRecognition(true)
      setSpeechRecognitionStatus('pending')

      // Check if we have cached result first
      const hasCached = await speechRecognitionService.hasCachedResult(videoId)

      if (hasCached) {
        const cached = await speechRecognitionService.getCachedResult(videoId)
        if (cached) {
          setSubtitles(cached)
          setSpeechRecognitionStatus('completed')
          setSpeechRecognitionProgress(100)
          setIsLoading(false)
          return
        }
      }

      // No cache, need to transcribe
      // Note: This requires audio URL which we don't have in this hook
      // The actual transcription should be triggered by the page/component
      // For now, we'll set status to pending and let the parent handle it
      setSpeechRecognitionStatus('pending')
      setSpeechRecognitionProgress(0)
      setIsLoading(false)

      // Set a specific error to indicate speech recognition is needed
      setError('NO_SUBTITLES')
    } catch (err) {
      console.error('Speech recognition fallback failed:', err)
      setSpeechRecognitionStatus('failed')
      setError('SUBTITLE_FETCH_FAILED')
      setSubtitles([])
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubtitles()
  }, [videoId, cid])

  return {
    subtitles,
    isLoading,
    error,
    isSpeechRecognition,
    speechRecognitionStatus,
    speechRecognitionProgress,
    refetch: fetchSubtitles,
  }
}

