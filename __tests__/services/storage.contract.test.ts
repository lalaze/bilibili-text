/**
 * Storage Service Contract Test
 * Tests the localStorage interface contract for highlight persistence
 */

import { UserHighlight } from '@/types/highlight'

describe('StorageService Contract', () => {
  let StorageService: any

  beforeAll(async () => {
    // Dynamically import to ensure clean test environment
    const module = await import('@/services/storage')
    StorageService = module.StorageService
  })

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('saveHighlights', () => {
    it('should save highlights to localStorage with correct key format', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'
      const highlights: UserHighlight[] = [
        {
          id: '1',
          videoId: videoId,
          segmentId: 'subtitle-0',
          createdAt: new Date('2025-11-19T10:00:00Z'),
        },
      ]

      service.saveHighlights(videoId, highlights)

      const key = `highlights:${videoId}`
      expect(localStorage.setItem).toHaveBeenCalledWith(
        key,
        expect.any(String)
      )

      const saved = JSON.parse(
        (localStorage.setItem as jest.Mock).mock.calls[0][1]
      )
      expect(saved).toHaveLength(1)
      expect(saved[0].id).toBe('1')
      expect(saved[0].segmentId).toBe('subtitle-0')
    })

    it('should handle empty highlights array', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'

      service.saveHighlights(videoId, [])

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `highlights:${videoId}`,
        JSON.stringify([])
      )
    })

    it('should serialize Date objects correctly', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'
      const createdAt = new Date('2025-11-19T10:00:00Z')
      const highlights: UserHighlight[] = [
        {
          id: '1',
          videoId: videoId,
          segmentId: 'subtitle-0',
          createdAt: createdAt,
        },
      ]

      service.saveHighlights(videoId, highlights)

      const saved = JSON.parse(
        (localStorage.setItem as jest.Mock).mock.calls[0][1]
      )
      expect(saved[0].createdAt).toBe(createdAt.toISOString())
    })
  })

  describe('loadHighlights', () => {
    it('should load highlights from localStorage', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'
      const mockData = [
        {
          id: '1',
          videoId: videoId,
          segmentId: 'subtitle-0',
          createdAt: '2025-11-19T10:00:00Z',
        },
      ]

      ;(localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(mockData)
      )

      const highlights = service.loadHighlights(videoId)

      expect(localStorage.getItem).toHaveBeenCalledWith(`highlights:${videoId}`)
      expect(highlights).toHaveLength(1)
      expect(highlights[0].id).toBe('1')
      expect(highlights[0].createdAt).toBeInstanceOf(Date)
    })

    it('should return empty array if no highlights found', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'

      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)

      const highlights = service.loadHighlights(videoId)

      expect(highlights).toEqual([])
    })

    it('should handle corrupted data gracefully', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'

      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid json')

      const highlights = service.loadHighlights(videoId)

      expect(highlights).toEqual([])
    })
  })

  describe('clearHighlights', () => {
    it('should remove highlights from localStorage', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'

      service.clearHighlights(videoId)

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        `highlights:${videoId}`
      )
    })
  })

  describe('isAvailable', () => {
    it('should return true if localStorage is available', () => {
      const service = new StorageService()

      expect(service.isAvailable()).toBe(true)
    })
  })

  describe('quota exceeded handling', () => {
    it('should throw error when quota is exceeded', () => {
      const service = new StorageService()
      const videoId = 'BV1xx411c7mD'
      const highlights: UserHighlight[] = [
        {
          id: '1',
          videoId: videoId,
          segmentId: 'subtitle-0',
          createdAt: new Date(),
        },
      ]

      // Mock quota exceeded error
      ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
        const error: any = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      expect(() => service.saveHighlights(videoId, highlights)).toThrow()
    })
  })
})

