'use client'

// app/video/[videoId]/page.tsx
// Video player page with subtitles

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import SubtitleDisplay from '@/components/SubtitleDisplay'
import ErrorMessage from '@/components/ErrorMessage'
import SpeechRecognitionStatus from '@/components/SpeechRecognitionStatus'
import { useSubtitles } from '@/hooks/useSubtitles'
import { useVideoPlayer } from '@/hooks/useVideoPlayer'
import { useSubtitleSync } from '@/hooks/useSubtitleSync'
import { useHighlights } from '@/hooks/useHighlights'
import { useVideoStore } from '@/stores/videoStore'
import { BilibiliService } from '@/services/bilibili'
import { speechRecognitionService } from '@/services/speechRecognition'
import { Video } from '@/types/video'
import { AppError } from '@/types/errors'

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.videoId as string

  const [video, setVideo] = useState<Video | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const {
    subtitles,
    isLoading: isLoadingSubtitles,
    error: subtitleError,
    isSpeechRecognition,
    speechRecognitionStatus,
    speechRecognitionProgress,
  } = useSubtitles(video?.id || null, video?.cid || null)

  // Use custom hooks for playback, sync, and highlights
  const { currentTime, setCurrentTime } = useVideoPlayer(videoId)
  const { activeSegmentId } = useSubtitleSync(currentTime, subtitles)
  const { highlights, toggleHighlight, highlightCount } = useHighlights(videoId)

  const { setError: setStoreError } = useVideoStore()

  // State for speech recognition
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  )
  const [hasAttemptedTranscription, setHasAttemptedTranscription] = useState(false)
  const [isNonRetryableError, setIsNonRetryableError] = useState(false)

  // Reset transcription state when video changes
  useEffect(() => {
    setHasAttemptedTranscription(false)
    setTranscriptionError(null)
    setIsNonRetryableError(false)
  }, [videoId])

  // Fetch video metadata on mount
  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return

      setIsLoadingVideo(true)
      setError(null)

      try {
        const service = new BilibiliService()
        const videoData = await service.fetchVideoMetadata(videoId)
        setVideo(videoData)
      } catch (err: any) {
        console.error('Failed to fetch video:', err)
        const errorCode = err.code || 'FETCH_FAILED'
        setError(errorCode)
        setStoreError(errorCode)
      } finally {
        setIsLoadingVideo(false)
      }
    }

    fetchVideo()
  }, [videoId, setStoreError])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handlePlayStateChange = (_playing: boolean) => {
    // Handle play state change if needed
  }

  const handleError = (_err: any) => {
    setError('FETCH_FAILED')
  }

  const handleSegmentClick = (segmentId: string) => {
    toggleHighlight(segmentId)
  }

  const handleDismissError = () => {
    setError(null)
    setTranscriptionError(null)
  }

  const handleRetryTranscription = () => {
    setHasAttemptedTranscription(false)
    setTranscriptionError(null)
  }

  const handleBack = () => {
    router.push('/')
  }

  // Trigger speech recognition when needed
  useEffect(() => {
    const triggerSpeechRecognition = async () => {
      if (
        !video ||
        !isSpeechRecognition ||
        isTranscribing ||
        speechRecognitionStatus === 'completed' ||
        hasAttemptedTranscription || // 防止重复尝试
        isNonRetryableError // 如果是不可重试的错误（如501），不再尝试
      ) {
        return
      }

      // Check if we need to trigger transcription
      if (
        subtitleError === 'NO_SUBTITLES' &&
        speechRecognitionStatus === 'pending'
      ) {
        setIsTranscribing(true)
        setTranscriptionError(null)
        setHasAttemptedTranscription(true) // 标记已尝试

        try {
          // Note: In a real implementation, we'd need the actual audio URL
          // For now, we'll use a placeholder URL based on the video ID
          const audioUrl = `https://bilibili.com/video/${video.id}/audio`

          await speechRecognitionService.transcribeVideo({
            videoId: video.id,
            audioUrl,
            language: 'zh',
          })

          // The subtitles will be updated through the useSubtitles hook
          // when the transcription is complete
        } catch (err: any) {
          console.error('语音识别失败:', err)
          // Extract more detailed error information
          let errorMessage = '语音识别失败，请稍后重试'
          if (err.message) {
            errorMessage = err.message
          }
          
          // 检查是否是不可重试的错误（501 NOT_IMPLEMENTED 或配置错误）
          if (err.retryable === false || err.status === 501) {
            setIsNonRetryableError(true)
            // 对于不可重试的错误，移除"请稍后重试"提示
            if (err.code === 'NOT_IMPLEMENTED' || err.status === 501) {
              errorMessage = err.message.replace('，请稍后重试', '')
            }
          }
          
          setTranscriptionError(errorMessage)
        } finally {
          setIsTranscribing(false)
        }
      }
    }

    triggerSpeechRecognition()
  }, [
    video,
    isSpeechRecognition,
    subtitleError,
    speechRecognitionStatus,
    isTranscribing,
    hasAttemptedTranscription,
    isNonRetryableError,
  ])

  if (isLoadingVideo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-lg text-gray-700">加载视频信息中...</p>
        </div>
      </div>
    )
  }

  if (error && !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <ErrorMessage error={error} onDismiss={handleDismissError} />
          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>返回</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 truncate ml-4">
              {video?.title || videoId}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {(error || subtitleError) && (
          <div className="mb-6">
            <ErrorMessage 
              error={error || subtitleError} 
              onDismiss={handleDismissError} 
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="space-y-4">
            {video && (
              <VideoPlayer
                videoId={video.id}
                embedUrl={video.embedUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlayStateChange={handlePlayStateChange}
                onError={handleError}
              />
            )}

            {/* Video Info */}
            {video && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  视频信息
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">视频ID:</dt>
                    <dd className="text-gray-900 font-mono">{video.id}</dd>
                  </div>
                  {video.duration && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">时长:</dt>
                      <dd className="text-gray-900">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">字幕数量:</dt>
                    <dd className="text-gray-900">{subtitles.length} 条</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">已标记:</dt>
                    <dd className="text-blue-600 font-medium">{highlightCount} 条</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* Subtitles */}
          <div>
            {/* Speech Recognition Status */}
            {isSpeechRecognition &&
              (speechRecognitionStatus === 'processing' ||
                speechRecognitionStatus === 'pending') && (
                <SpeechRecognitionStatus
                  status={speechRecognitionStatus}
                  progress={speechRecognitionProgress}
                />
              )}

            {/* Transcription Error */}
            {transcriptionError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      语音识别失败
                    </h3>
                    <p className="text-sm text-red-700 whitespace-pre-wrap mb-3">
                      {transcriptionError}
                    </p>
                    <button
                      onClick={handleRetryTranscription}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      重试
                    </button>
                  </div>
                  <button
                    onClick={() => setTranscriptionError(null)}
                    className="ml-3 text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {isLoadingSubtitles ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-600">加载字幕中...</p>
              </div>
            ) : subtitles.length > 0 ? (
              <SubtitleDisplay
                subtitles={subtitles}
                activeSegmentId={activeSegmentId}
                highlightedSegmentIds={highlights}
                onSegmentClick={handleSegmentClick}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600">
                  {isSpeechRecognition
                    ? '正在准备语音识别...'
                    : '暂无字幕数据'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

