// lib/utils.ts
// Shared utility functions

/**
 * Formats time in seconds to MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generates a unique ID using crypto.randomUUID (browser native)
 * Falls back to timestamp-based ID if randomUUID is not available
 * @returns UUID string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Extracts Bilibili video ID from URL
 * @param url - Bilibili video URL
 * @returns Video ID or null if invalid
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Support both BV and av format
    // Example: https://www.bilibili.com/video/BV1xx411c7mD
    // Example: https://www.bilibili.com/video/av12345
    const match = urlObj.pathname.match(/\/video\/(BV[\w]+|av\d+)/)

    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Validates Bilibili video URL
 * @param url - URL to validate
 * @returns True if valid Bilibili video URL
 */
export function isValidBilibiliUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname.includes('bilibili.com') &&
      urlObj.pathname.includes('/video/') &&
      extractVideoId(url) !== null
    )
  } catch {
    return false
  }
}

/**
 * Clamps a number between min and max values
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Combines CSS class names
 * @param classes - Class names to combine
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

