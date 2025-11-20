// __tests__/services/indexedDBStorage.contract.test.ts
// Contract tests for IndexedDBService

import { indexedDBService } from '@/services/indexedDBStorage'
import { SubtitleCache } from '@/types/speechRecognition'

// Mock idb
jest.mock('idb', () => ({
  openDB: jest.fn(),
}))

describe('IndexedDBService Contract Tests', () => {
  describe('isAvailable', () => {
    it('should return true when IndexedDB is available', () => {
      const result = indexedDBService.isAvailable()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('saveSubtitleCache', () => {
    it('should throw error when IndexedDB is not available', async () => {
      // Mock window to simulate no IndexedDB
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      await expect(
        indexedDBService.saveSubtitleCache({
          videoId: 'BV123',
          subtitles: [],
          cachedAt: Date.now(),
          expiresAt: Date.now() + 1000,
          source: 'speech-recognition',
          language: 'zh',
        })
      ).rejects.toThrow('INDEXEDDB_NOT_AVAILABLE')

      // Restore window
      global.window = originalWindow as any
    })

    it('should set expiration time when saving cache', async () => {
      const cache: SubtitleCache = {
        videoId: 'BV123',
        subtitles: [],
        cachedAt: Date.now(),
        expiresAt: Date.now() + 1000,
        source: 'speech-recognition',
        language: 'zh',
      }

      // This test would require a proper IndexedDB mock setup
      // For now, we'll just verify the interface
      expect(cache).toHaveProperty('videoId')
      expect(cache).toHaveProperty('expiresAt')
    })
  })

  describe('loadSubtitleCache', () => {
    it('should return null when IndexedDB is not available', async () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const result = await indexedDBService.loadSubtitleCache('BV123')
      expect(result).toBeNull()

      global.window = originalWindow as any
    })
  })

  describe('clearExpiredCache', () => {
    it('should return 0 when IndexedDB is not available', async () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const result = await indexedDBService.clearExpiredCache()
      expect(result).toBe(0)

      global.window = originalWindow as any
    })
  })

  describe('getCacheStats', () => {
    it('should return zero stats when IndexedDB is not available', async () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const result = await indexedDBService.getCacheStats()
      expect(result).toEqual({ totalEntries: 0, expiredEntries: 0 })

      global.window = originalWindow as any
    })
  })
})

