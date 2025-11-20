// services/storage.ts
// LocalStorage wrapper for highlight persistence

import { UserHighlight } from '@/types/highlight'
import { BilibiliError } from '@/types/errors'

export class StorageService {
  private readonly KEY_PREFIX = 'highlights:'

  /**
   * Gets the storage key for a specific video
   */
  private getKey(videoId: string): string {
    return `${this.KEY_PREFIX}${videoId}`
  }

  /**
   * Checks if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Saves user highlights for a video
   * @throws {BilibiliError} If quota exceeded or storage unavailable
   */
  saveHighlights(videoId: string, highlights: UserHighlight[]): void {
    if (!this.isAvailable()) {
      throw new BilibiliError(
        'STORAGE_UNAVAILABLE',
        '浏览器存储不可用'
      )
    }

    try {
      const key = this.getKey(videoId)
      const data = highlights.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      }))
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        throw new BilibiliError(
          'QUOTA_EXCEEDED',
          '存储空间已满，请清理旧的高亮标记',
          '请尝试清除浏览器存储或删除不需要的高亮'
        )
      }
      throw error
    }
  }

  /**
   * Loads user highlights for a video
   * @returns Array of highlights, empty if none found or error occurs
   */
  loadHighlights(videoId: string): UserHighlight[] {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const key = this.getKey(videoId)
      const data = localStorage.getItem(key)

      if (!data) {
        return []
      }

      const parsed = JSON.parse(data)
      return parsed.map((h: any) => ({
        ...h,
        createdAt: new Date(h.createdAt),
      }))
    } catch (error) {
      // Return empty array on parse error instead of throwing
      console.error('Failed to load highlights:', error)
      return []
    }
  }

  /**
   * Clears all highlights for a video
   */
  clearHighlights(videoId: string): void {
    if (!this.isAvailable()) {
      return
    }

    const key = this.getKey(videoId)
    localStorage.removeItem(key)
  }

  /**
   * Gets all highlight keys (for cleanup/debugging)
   */
  getAllHighlightKeys(): string[] {
    if (!this.isAvailable()) {
      return []
    }

    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.KEY_PREFIX)) {
        keys.push(key)
      }
    }
    return keys
  }

  /**
   * Clears all highlights (for testing/cleanup)
   */
  clearAll(): void {
    if (!this.isAvailable()) {
      return
    }

    const keys = this.getAllHighlightKeys()
    keys.forEach((key) => localStorage.removeItem(key))
  }
}

