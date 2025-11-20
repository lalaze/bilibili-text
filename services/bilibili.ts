// services/bilibili.ts
// Service for interacting with Bilibili API (via Next.js API routes)

import { Video } from '@/types/video'
import { SubtitleData } from '@/types/subtitle'
import { BilibiliError } from '@/types/errors'

export class BilibiliService {
  /**
   * Validates a Bilibili video URL and extracts video ID
   * @param url - Full Bilibili video URL
   * @returns Validation result with video ID
   * @throws {BilibiliError} If validation request fails
   */
  async validateUrl(url: string): Promise<{
    valid: boolean
    videoId: string | null
    urlType?: 'BV' | 'AV' | null
  }> {
    try {
      const response = await fetch('/api/bilibili/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new BilibiliError(
          'FETCH_FAILED',
          '验证URL失败'
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof BilibiliError) {
        throw error
      }
      throw new BilibiliError(
        'FETCH_FAILED',
        '网络请求失败',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Fetches video metadata from Bilibili
   * @param videoId - Bilibili video ID (BV or av format)
   * @returns Video metadata
   * @throws {BilibiliError} If video not found or fetch fails
   */
  async fetchVideoMetadata(videoId: string): Promise<Video> {
    try {
      const response = await fetch(`/api/bilibili/video?videoId=${videoId}`)

      if (!response.ok) {
        const errorData = await response.json()
        const errorCode = errorData.error?.code || 'FETCH_FAILED'
        const errorMessage = errorData.error?.message || '获取视频信息失败'

        throw new BilibiliError(
          errorCode,
          errorMessage,
          errorData.error?.details
        )
      }

      const video = await response.json()

      // Convert loadedAt to Date object if it's a string
      if (typeof video.loadedAt === 'string') {
        video.loadedAt = new Date(video.loadedAt)
      } else {
        video.loadedAt = new Date()
      }

      return video
    } catch (error) {
      if (error instanceof BilibiliError) {
        throw error
      }
      throw new BilibiliError(
        'FETCH_FAILED',
        '获取视频信息失败',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Fetches subtitle data for a video
   * @param videoId - Bilibili video ID
   * @param cid - Content ID (from video metadata)
   * @param lang - Optional language preference
   * @returns Subtitle data with tracks and parsed segments
   * @throws {BilibiliError} If subtitles not available or fetch fails
   */
  async fetchSubtitles(
    videoId: string,
    cid: string,
    lang?: string
  ): Promise<SubtitleData> {
    if (!cid) {
      throw new BilibiliError(
        'INVALID_PARAMS',
        '缺少必要参数：cid'
      )
    }

    try {
      const url = new URL('/api/bilibili/subtitles', window.location.origin)
      url.searchParams.set('videoId', videoId)
      url.searchParams.set('cid', cid)
      if (lang) {
        url.searchParams.set('lang', lang)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json()
        const errorCode = errorData.error?.code || 'SUBTITLE_FETCH_FAILED'
        const errorMessage = errorData.error?.message || '获取字幕失败'

        throw new BilibiliError(
          errorCode,
          errorMessage,
          errorData.error?.details
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof BilibiliError) {
        throw error
      }
      throw new BilibiliError(
        'SUBTITLE_FETCH_FAILED',
        '获取字幕失败',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Fetches both video metadata and subtitles in one call
   * @param videoId - Bilibili video ID
   * @returns Video and subtitle data
   */
  async fetchVideoData(videoId: string): Promise<{
    video: Video
    subtitles: SubtitleData
  }> {
    // First fetch video metadata to get cid
    const video = await this.fetchVideoMetadata(videoId)

    if (!video.cid) {
      throw new BilibiliError(
        'INVALID_VIDEO_ID',
        '无法获取视频内容ID',
        '该视频可能不支持字幕功能'
      )
    }

    // Then fetch subtitles using cid
    const subtitles = await this.fetchSubtitles(videoId, video.cid)

    return { video, subtitles }
  }
}

