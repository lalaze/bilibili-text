/**
 * Bilibili Service Contract Test
 * Tests the Bilibili API service contract for video and subtitle data fetching
 */

import { Video } from '@/types/video'
import { SubtitleData } from '@/types/subtitle'

describe('BilibiliService Contract', () => {
  let BilibiliService: any

  beforeAll(async () => {
    const module = await import('@/services/bilibili')
    BilibiliService = module.BilibiliService
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fetch globally
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateUrl', () => {
    it('should validate correct Bilibili URL and extract video ID', async () => {
      const service = new BilibiliService()
      const url = 'https://www.bilibili.com/video/BV1xx411c7mD'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          videoId: 'BV1xx411c7mD',
          urlType: 'BV',
        }),
      })

      const result = await service.validateUrl(url)

      expect(result.valid).toBe(true)
      expect(result.videoId).toBe('BV1xx411c7mD')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bilibili/validate-url',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
      )
    })

    it('should return invalid for incorrect URL', async () => {
      const service = new BilibiliService()
      const url = 'https://example.com/video'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          videoId: null,
          urlType: null,
        }),
      })

      const result = await service.validateUrl(url)

      expect(result.valid).toBe(false)
      expect(result.videoId).toBeNull()
    })
  })

  describe('fetchVideoMetadata', () => {
    it('should fetch video metadata from API', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'
      const mockVideo: Video = {
        id: videoId,
        url: `https://www.bilibili.com/video/${videoId}`,
        title: 'Test Video',
        duration: 600,
        cid: '123456789',
        embedUrl: `https://player.bilibili.com/player.html?bvid=${videoId}&cid=123456789`,
        loadedAt: new Date('2025-11-19T10:00:00Z'),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideo,
      })

      const video = await service.fetchVideoMetadata(videoId)

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/bilibili/video?videoId=${videoId}`
      )
      expect(video.id).toBe(videoId)
      expect(video.title).toBe('Test Video')
      expect(video.duration).toBe(600)
      expect(video.cid).toBe('123456789')
    })

    it('should throw VIDEO_NOT_FOUND error when video does not exist', async () => {
      const service = new BilibiliService()
      const videoId = 'BV_invalid'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: 'Video not found',
          },
        }),
      })

      await expect(service.fetchVideoMetadata(videoId)).rejects.toThrow(
        'VIDEO_NOT_FOUND'
      )
    })

    it('should throw FETCH_FAILED error on network failure', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(service.fetchVideoMetadata(videoId)).rejects.toThrow()
    })
  })

  describe('fetchSubtitles', () => {
    it('should fetch and parse subtitle data', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'
      const cid = '123456789'
      const mockSubtitleData: SubtitleData = {
        videoId,
        tracks: [
          {
            lang: 'zh-CN',
            langDoc: '中文（中国）',
            url: 'https://example.com/subtitle.json',
          },
        ],
        subtitles: [
          {
            id: 'subtitle-0',
            videoId,
            startTime: 0,
            endTime: 2.5,
            text: 'Hello world',
            index: 0,
          },
          {
            id: 'subtitle-1',
            videoId,
            startTime: 2.5,
            endTime: 5.0,
            text: 'Welcome',
            index: 1,
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubtitleData,
      })

      const subtitleData = await service.fetchSubtitles(videoId, cid)

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/bilibili/subtitles?videoId=${videoId}&cid=${cid}`
      )
      expect(subtitleData.videoId).toBe(videoId)
      expect(subtitleData.tracks).toHaveLength(1)
      expect(subtitleData.subtitles).toHaveLength(2)
      expect(subtitleData.subtitles[0].text).toBe('Hello world')
    })

    it('should throw NO_SUBTITLES error when video has no subtitles', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'
      const cid = '123456789'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'NO_SUBTITLES',
            message: 'No subtitles available',
          },
        }),
      })

      await expect(service.fetchSubtitles(videoId, cid)).rejects.toThrow(
        'NO_SUBTITLES'
      )
    })

    it('should handle missing cid parameter', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'

      await expect(service.fetchSubtitles(videoId, '')).rejects.toThrow()
    })
  })

  describe('error response format', () => {
    it('should handle API error responses correctly', async () => {
      const service = new BilibiliService()
      const videoId = 'BV1xx411c7mD'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch video data',
            details: 'Internal server error',
            timestamp: '2025-11-19T10:00:00Z',
          },
        }),
      })

      try {
        await service.fetchVideoMetadata(videoId)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toContain('FETCH_FAILED')
      }
    })
  })
})

