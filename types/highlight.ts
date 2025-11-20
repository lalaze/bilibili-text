// types/highlight.ts
// UserHighlight represents user-created annotation on a subtitle segment

export interface UserHighlight {
  id: string // Unique highlight identifier (UUID v4)
  videoId: string // Reference to parent video
  segmentId: string // Reference to subtitle segment
  createdAt: Date // Timestamp when highlight was created
  color?: string // Highlight color (future enhancement, hex code)
}

export type StorageError = 'QUOTA_EXCEEDED' | 'STORAGE_UNAVAILABLE'

