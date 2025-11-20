// services/subtitleParser.ts
// Parses Bilibili subtitle format into app data model

import { SubtitleSegment } from '@/types/subtitle'

/**
 * Bilibili subtitle JSON format
 */
interface BilibiliSubtitleItem {
  from: number // Start time in seconds
  to: number // End time in seconds
  content: string // Subtitle text
}

/**
 * Parses Bilibili subtitle JSON into app SubtitleSegment format
 * @param raw - Raw subtitle data from Bilibili API
 * @param videoId - Video ID for reference
 * @returns Array of SubtitleSegment objects
 */
export function parseSubtitles(
  raw: BilibiliSubtitleItem[],
  videoId: string
): SubtitleSegment[] {
  if (!Array.isArray(raw)) {
    console.error('Invalid subtitle data: expected array')
    return []
  }

  return raw
    .filter((item) => {
      // Validate required fields
      if (
        typeof item.from !== 'number' ||
        typeof item.to !== 'number' ||
        typeof item.content !== 'string'
      ) {
        console.warn('Invalid subtitle item, skipping:', item)
        return false
      }

      // Validate timing
      if (item.from < 0 || item.to <= item.from) {
        console.warn('Invalid timing in subtitle item, skipping:', item)
        return false
      }

      // Validate text
      if (item.content.trim().length === 0) {
        console.warn('Empty subtitle content, skipping:', item)
        return false
      }

      return true
    })
    .map((item, index) => ({
      id: `subtitle-${index}`,
      videoId,
      startTime: item.from,
      endTime: item.to,
      text: item.content.trim(),
      index,
    }))
}

/**
 * Validates subtitle data structure
 * @param data - Raw subtitle data
 * @returns True if valid
 */
export function isValidSubtitleData(data: any): data is BilibiliSubtitleItem[] {
  if (!Array.isArray(data)) {
    return false
  }

  if (data.length === 0) {
    return false
  }

  return data.every(
    (item) =>
      typeof item === 'object' &&
      typeof item.from === 'number' &&
      typeof item.to === 'number' &&
      typeof item.content === 'string'
  )
}

/**
 * Finds the active subtitle segment for a given time
 * @param currentTime - Current playback time in seconds
 * @param subtitles - Array of subtitle segments
 * @returns Active segment or null
 */
export function findActiveSubtitle(
  currentTime: number,
  subtitles: SubtitleSegment[]
): SubtitleSegment | null {
  return (
    subtitles.find(
      (s) => s.startTime <= currentTime && currentTime < s.endTime
    ) || null
  )
}

/**
 * Gets subtitle segment by ID
 * @param segmentId - Segment ID to find
 * @param subtitles - Array of subtitle segments
 * @returns Found segment or null
 */
export function getSubtitleById(
  segmentId: string,
  subtitles: SubtitleSegment[]
): SubtitleSegment | null {
  return subtitles.find((s) => s.id === segmentId) || null
}

/**
 * Converts subtitle segments to SRT format (for export)
 * @param subtitles - Array of subtitle segments
 * @returns SRT formatted string
 */
export function toSRT(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.startTime)
      const endTime = formatSRTTime(subtitle.endTime)
      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`
    })
    .join('\n')
}

/**
 * Formats time for SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
}

