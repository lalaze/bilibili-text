// services/indexedDBStorage.ts
// IndexedDB service for caching subtitle data

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { SubtitleCache } from '@/types/speechRecognition'

interface SubtitleDBSchema extends DBSchema {
  'subtitle-cache': {
    key: string // videoId
    value: SubtitleCache
    indexes: {
      'by-expires': number // expiresAt for cleanup
    }
  }
}

const DB_NAME = 'bilibili-subtitles'
const DB_VERSION = 1
const CACHE_STORE = 'subtitle-cache'
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

class IndexedDBService {
  private db: IDBPDatabase<SubtitleDBSchema> | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB database
   * Creates object stores and indexes if needed
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB<SubtitleDBSchema>(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
              const store = db.createObjectStore(CACHE_STORE, {
                keyPath: 'videoId',
              })
              // Create index for expiration-based queries
              store.createIndex('by-expires', 'expiresAt')
            }
          },
        })
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error)
        throw new Error('INDEXEDDB_INIT_FAILED')
      }
    })()

    return this.initPromise
  }

  /**
   * Check if IndexedDB is available in the browser
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window
  }

  /**
   * Save subtitle cache to IndexedDB
   */
  async saveSubtitleCache(cache: SubtitleCache): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('INDEXEDDB_NOT_AVAILABLE')
    }

    await this.initialize()

    if (!this.db) {
      throw new Error('INDEXEDDB_NOT_INITIALIZED')
    }

    try {
      // Set expiration time
      const cacheWithExpiry: SubtitleCache = {
        ...cache,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
      }

      await this.db.put(CACHE_STORE, cacheWithExpiry)
    } catch (error) {
      console.error('Failed to save subtitle cache:', error)
      throw new Error('CACHE_SAVE_FAILED')
    }
  }

  /**
   * Load subtitle cache from IndexedDB
   * Returns null if cache doesn't exist or is expired
   */
  async loadSubtitleCache(videoId: string): Promise<SubtitleCache | null> {
    if (!this.isAvailable()) {
      return null
    }

    await this.initialize()

    if (!this.db) {
      return null
    }

    try {
      const cache = await this.db.get(CACHE_STORE, videoId)

      if (!cache) {
        return null
      }

      // Check if cache is expired
      if (cache.expiresAt < Date.now()) {
        // Delete expired cache
        await this.db.delete(CACHE_STORE, videoId)
        return null
      }

      return cache
    } catch (error) {
      console.error('Failed to load subtitle cache:', error)
      return null
    }
  }

  /**
   * Clear all expired cache entries
   * Should be called periodically (e.g., on app startup)
   */
  async clearExpiredCache(): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }

    await this.initialize()

    if (!this.db) {
      return 0
    }

    try {
      const now = Date.now()
      const tx = this.db.transaction(CACHE_STORE, 'readwrite')
      const store = tx.objectStore(CACHE_STORE)
      const index = store.index('by-expires')

      let deletedCount = 0

      // Get all entries with expiresAt < now
      let cursor = await index.openCursor(IDBKeyRange.upperBound(now))

      while (cursor) {
        await cursor.delete()
        deletedCount++
        cursor = await cursor.continue()
      }

      await tx.done

      return deletedCount
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
      return 0
    }
  }

  /**
   * Clear all cache entries for a specific video
   */
  async clearVideoCache(videoId: string): Promise<void> {
    if (!this.isAvailable()) {
      return
    }

    await this.initialize()

    if (!this.db) {
      return
    }

    try {
      await this.db.delete(CACHE_STORE, videoId)
    } catch (error) {
      console.error('Failed to clear video cache:', error)
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAllCache(): Promise<void> {
    if (!this.isAvailable()) {
      return
    }

    await this.initialize()

    if (!this.db) {
      return
    }

    try {
      await this.db.clear(CACHE_STORE)
    } catch (error) {
      console.error('Failed to clear all cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    expiredEntries: number
  }> {
    if (!this.isAvailable()) {
      return { totalEntries: 0, expiredEntries: 0 }
    }

    await this.initialize()

    if (!this.db) {
      return { totalEntries: 0, expiredEntries: 0 }
    }

    try {
      const now = Date.now()
      const tx = this.db.transaction(CACHE_STORE, 'readonly')
      const store = tx.objectStore(CACHE_STORE)
      const index = store.index('by-expires')

      const totalEntries = await store.count()
      const expiredEntries = await index.count(IDBKeyRange.upperBound(now))

      await tx.done

      return { totalEntries, expiredEntries }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { totalEntries: 0, expiredEntries: 0 }
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService()

