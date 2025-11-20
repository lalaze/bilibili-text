// __tests__/services/speechRecognition.contract.test.ts
// Contract tests for SpeechRecognitionService

import { speechRecognitionService } from '@/services/speechRecognition'
import { indexedDBService } from '@/services/indexedDBStorage'

// Mock IndexedDB service
jest.mock('@/services/indexedDBStorage', () => ({
  indexedDBService: {
    loadSubtitleCache: jest.fn(),
    saveSubtitleCache: jest.fn(),
    clearVideoCache: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('SpeechRecognitionService Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasCachedResult', () => {
    it('should return true when valid cache exists', async () => {
      const mockCache = {
        videoId: 'BV123',
        subtitles: [],
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        source: 'speech-recognition' as const,
        language: 'zh',
      }

      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(
        mockCache
      )

      const result = await speechRecognitionService.hasCachedResult('BV123')

      expect(result).toBe(true)
      expect(indexedDBService.loadSubtitleCache).toHaveBeenCalledWith('BV123')
    })

    it('should return false when no cache exists', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(null)

      const result = await speechRecognitionService.hasCachedResult('BV123')

      expect(result).toBe(false)
    })

    it('should return false when cache source is not speech-recognition', async () => {
      const mockCache = {
        videoId: 'BV123',
        subtitles: [],
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        source: 'native' as const,
        language: 'zh',
      }

      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(
        mockCache
      )

      const result = await speechRecognitionService.hasCachedResult('BV123')

      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockRejectedValue(
        new Error('Cache error')
      )

      const result = await speechRecognitionService.hasCachedResult('BV123')

      expect(result).toBe(false)
    })
  })

  describe('getCachedResult', () => {
    it('should return cached subtitles when they exist', async () => {
      const mockSubtitles = [
        {
          id: 'subtitle-0',
          videoId: 'BV123',
          startTime: 0,
          endTime: 5,
          text: 'Test subtitle',
          index: 0,
          language: 'zh',
        },
      ]

      const mockCache = {
        videoId: 'BV123',
        subtitles: mockSubtitles,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        source: 'speech-recognition' as const,
        language: 'zh',
      }

      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(
        mockCache
      )

      const result = await speechRecognitionService.getCachedResult('BV123')

      expect(result).toEqual(mockSubtitles)
    })

    it('should return null when no cache exists', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(null)

      const result = await speechRecognitionService.getCachedResult('BV123')

      expect(result).toBeNull()
    })
  })

  describe('transcribeVideo', () => {
    it('should return cached result when available', async () => {
      const mockSubtitles = [
        {
          id: 'subtitle-0',
          videoId: 'BV123',
          startTime: 0,
          endTime: 5,
          text: 'Cached subtitle',
          index: 0,
          language: 'zh',
        },
      ]

      const mockCache = {
        videoId: 'BV123',
        subtitles: mockSubtitles,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        source: 'speech-recognition' as const,
        language: 'zh',
      }

      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(
        mockCache
      )

      const result = await speechRecognitionService.transcribeVideo({
        videoId: 'BV123',
        audioUrl: 'https://example.com/audio.mp3',
      })

      expect(result.cached).toBe(true)
      expect(result.subtitles).toEqual(mockSubtitles)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should call API when no cache exists', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(null)

      const mockApiResponse = {
        videoId: 'BV123',
        subtitles: [
          {
            id: 'subtitle-0',
            videoId: 'BV123',
            startTime: 0,
            endTime: 5,
            text: 'API subtitle',
            index: 0,
            language: 'zh',
          },
        ],
        source: 'speech-recognition',
        language: 'zh',
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      ;(indexedDBService.saveSubtitleCache as jest.Mock).mockResolvedValue(
        undefined
      )

      const result = await speechRecognitionService.transcribeVideo({
        videoId: 'BV123',
        audioUrl: 'https://example.com/audio.mp3',
        language: 'zh',
      })

      expect(result.cached).toBe(false)
      expect(result.subtitles).toEqual(mockApiResponse.subtitles)
      expect(fetch).toHaveBeenCalledWith(
        '/api/bilibili/speech/transcribe',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should force refresh when forceRefresh is true', async () => {
      const mockApiResponse = {
        videoId: 'BV123',
        subtitles: [],
        source: 'speech-recognition',
        language: 'zh',
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      ;(indexedDBService.saveSubtitleCache as jest.Mock).mockResolvedValue(
        undefined
      )

      await speechRecognitionService.transcribeVideo({
        videoId: 'BV123',
        audioUrl: 'https://example.com/audio.mp3',
        forceRefresh: true,
      })

      expect(indexedDBService.loadSubtitleCache).not.toHaveBeenCalled()
      expect(fetch).toHaveBeenCalled()
    })

    it('should throw error when API call fails', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(null)

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'TRANSCRIPTION_FAILED' }),
      })

      await expect(
        speechRecognitionService.transcribeVideo({
          videoId: 'BV123',
          audioUrl: 'https://example.com/audio.mp3',
        })
      ).rejects.toThrow()
    })
  })

  describe('clearCache', () => {
    it('should call IndexedDB clearVideoCache', async () => {
      ;(indexedDBService.clearVideoCache as jest.Mock).mockResolvedValue(
        undefined
      )

      await speechRecognitionService.clearCache('BV123')

      expect(indexedDBService.clearVideoCache).toHaveBeenCalledWith('BV123')
    })

    it('should handle errors gracefully', async () => {
      ;(indexedDBService.clearVideoCache as jest.Mock).mockRejectedValue(
        new Error('Clear error')
      )

      // Should not throw
      await expect(
        speechRecognitionService.clearCache('BV123')
      ).resolves.not.toThrow()
    })
  })

  describe('checkStatus', () => {
    it('should return completed status when cache exists', async () => {
      const mockCache = {
        videoId: 'BV123',
        subtitles: [],
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000000,
        source: 'speech-recognition' as const,
        language: 'zh',
      }

      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(
        mockCache
      )

      const result = await speechRecognitionService.checkStatus('BV123')

      expect(result.status).toBe('completed')
      expect(result.progress).toBe(100)
    })

    it('should return pending status when no cache exists', async () => {
      ;(indexedDBService.loadSubtitleCache as jest.Mock).mockResolvedValue(null)

      const result = await speechRecognitionService.checkStatus('BV123')

      expect(result.status).toBe('pending')
      expect(result.progress).toBe(0)
    })
  })
})

