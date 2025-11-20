# Data Model: Bilibili Video Subtitle Synchronization

**Date**: 2025-11-19
**Feature**: 001-bilibili-subtitle-sync

## Overview

This document defines the core data entities, their relationships, validation rules, and state transitions for the Bilibili subtitle synchronization application.

---

## Core Entities

### 1. Video

Represents a Bilibili video with its metadata and playback state.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Bilibili video ID (BV or AV format) | Matches pattern: `^(BV\|av)[A-Za-z0-9]+$` |
| url | string | Yes | Full Bilibili video URL | Valid URL, contains bilibili.com domain |
| title | string | No | Video title (fetched from API) | Max 200 characters |
| duration | number | No | Video duration in seconds | Positive number |
| cid | string | No | Content ID (required for subtitle fetch) | Numeric string |
| embedUrl | string | Yes | Iframe embed URL | Valid URL |
| loadedAt | Date | Yes | Timestamp when video was loaded | ISO 8601 format |

**Relationships**:
- Has many SubtitleSegments (1:N)
- Has many UserHighlights (1:N)

**State Transitions**:
```
INITIAL → LOADING → LOADED → PLAYING/PAUSED → ERROR
```

**TypeScript Definition**:
```typescript
interface Video {
  id: string
  url: string
  title?: string
  duration?: number
  cid?: string
  embedUrl: string
  loadedAt: Date
}
```

---

### 2. SubtitleSegment

Individual subtitle entry with timing and text content.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique segment identifier | Format: `subtitle-{index}` or UUID |
| videoId | string | Yes | Reference to parent video | Matches Video.id |
| startTime | number | Yes | Start timestamp in seconds | >= 0, < endTime |
| endTime | number | Yes | End timestamp in seconds | > startTime, <= video.duration |
| text | string | Yes | Subtitle text content | Non-empty, max 500 characters |
| index | number | Yes | Sequential position in subtitle list | >= 0, unique per video |
| language | string | No | Subtitle language code | ISO 639-1 code (e.g., 'zh', 'en') |
| source | 'native' \| 'speech' | Yes | Subtitle source type | 'native' for Bilibili original, 'speech' for AI generated |
| confidence | number | No | Recognition confidence (0-1) | Only for speech-generated subtitles |

**Relationships**:
- Belongs to Video (N:1)
- May have UserHighlight (1:1 optional)

**Validation Rules**:
- `startTime < endTime`
- No negative timestamps
- Text must not be empty after trimming
- Index must be sequential within video
- `confidence` only valid when `source === 'speech'`

**TypeScript Definition**:
```typescript
interface SubtitleSegment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  text: string
  index: number
  language?: string
  source: 'native' | 'speech'
  confidence?: number // 0-1, only for speech-generated
}
```

---

### 3. UserHighlight

User-created annotation on a subtitle segment.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique highlight identifier | UUID v4 |
| videoId | string | Yes | Reference to parent video | Matches Video.id |
| segmentId | string | Yes | Reference to subtitle segment | Matches SubtitleSegment.id |
| createdAt | Date | Yes | Timestamp when highlight was created | ISO 8601 format |
| color | string | No | Highlight color (future enhancement) | Hex color code |

**Relationships**:
- Belongs to Video (N:1)
- Belongs to SubtitleSegment (N:1)

**Storage**:
- Persisted in browser localStorage
- Key format: `highlights:{videoId}`
- Value: JSON array of UserHighlight objects

**TypeScript Definition**:
```typescript
interface UserHighlight {
  id: string
  videoId: string
  segmentId: string
  createdAt: Date
  color?: string
}
```

---

### 4. PlaybackState

Current video playback state (ephemeral, not persisted).

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| videoId | string | Yes | Current video ID | Matches Video.id |
| currentTime | number | Yes | Current playback position in seconds | >= 0, <= duration |
| isPlaying | boolean | Yes | Whether video is currently playing | true/false |
| activeSegmentId | string | No | Currently highlighted segment | Matches SubtitleSegment.id |
| playbackRate | number | No | Playback speed multiplier | 0.25 to 2.0 |
| volume | number | No | Volume level | 0.0 to 1.0 |

**State Transitions**:
```
IDLE → PLAYING ⇄ PAUSED → ENDED → IDLE
```

**TypeScript Definition**:
```typescript
interface PlaybackState {
  videoId: string
  currentTime: number
  isPlaying: boolean
  activeSegmentId: string | null
  playbackRate?: number
  volume?: number
}
```

---

### 5. SpeechRecognitionTask

Represents an ongoing or completed speech recognition task for a video.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique task identifier | UUID v4 |
| videoId | string | Yes | Reference to video | Matches Video.id |
| status | TaskStatus | Yes | Current task status | enum: 'pending' \| 'extracting' \| 'transcribing' \| 'completed' \| 'failed' |
| progress | number | Yes | Progress percentage (0-100) | 0-100 |
| startedAt | Date | Yes | When task started | ISO 8601 format |
| completedAt | Date | No | When task completed or failed | ISO 8601 format |
| errorMessage | string | No | Error message if failed | Present only when status='failed' |
| estimatedTimeRemaining | number | No | Estimated seconds remaining | Only during processing |
| audioDuration | number | No | Total audio duration in seconds | Available after extraction |

**Relationships**:
- Belongs to Video (N:1)
- Produces SubtitleSegments (1:N) when completed

**State Transitions**:
```
pending → extracting → transcribing → completed
                              ↓
                           failed
```

**TypeScript Definition**:
```typescript
type TaskStatus = 'pending' | 'extracting' | 'transcribing' | 'completed' | 'failed'

interface SpeechRecognitionTask {
  id: string
  videoId: string
  status: TaskStatus
  progress: number // 0-100
  startedAt: Date
  completedAt?: Date
  errorMessage?: string
  estimatedTimeRemaining?: number
  audioDuration?: number
}
```

---

### 6. SubtitleCache

IndexedDB cache entry for generated subtitles.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| videoId | string | Yes | Video identifier (primary key) | Matches Video.id |
| subtitles | SubtitleSegment[] | Yes | Array of subtitle segments | Non-empty array |
| source | 'native' \| 'speech' | Yes | How subtitles were obtained | Matches SubtitleSegment.source |
| createdAt | Date | Yes | When cache was created | ISO 8601 format |
| expiresAt | Date | Yes | Cache expiration time | createdAt + 30 days |
| audioSize | number | No | Audio file size in bytes | Only for speech source |
| recognitionDuration | number | No | Time taken to recognize (seconds) | Only for speech source |

**Storage**:
- Stored in IndexedDB database: `bilibili-text-db`
- Object store: `subtitle-cache`
- Index on: `expiresAt` (for cleanup), `source` (for queries)

**TypeScript Definition**:
```typescript
interface SubtitleCache {
  videoId: string // Primary key
  subtitles: SubtitleSegment[]
  source: 'native' | 'speech'
  createdAt: Date
  expiresAt: Date
  audioSize?: number
  recognitionDuration?: number
}
```

---

## Derived Data

### ActiveSubtitle

Computed from PlaybackState.currentTime and SubtitleSegments.

**Logic**:
```typescript
function getActiveSubtitle(
  currentTime: number,
  subtitles: SubtitleSegment[]
): SubtitleSegment | null {
  return subtitles.find(
    s => s.startTime <= currentTime && currentTime < s.endTime
  ) ?? null
}
```

### HighlightedSegments

Set of segment IDs that have user highlights.

**Logic**:
```typescript
function getHighlightedSegmentIds(
  highlights: UserHighlight[]
): Set<string> {
  return new Set(highlights.map(h => h.segmentId))
}
```

---

## Data Flow

### 1. Video Loading Flow (with Speech Recognition Fallback)

```
User enters URL
  ↓
Extract video ID from URL
  ↓
Validate URL format
  ↓
Fetch video metadata (title, duration, cid)
  ↓
Generate embed URL
  ↓
Create Video entity
  ↓
Try: Fetch native subtitle data from Bilibili API
  ↓
[SUCCESS: Has native subtitles]
  ↓
  Parse subtitle JSON
  ↓
  Create SubtitleSegment entities (source='native')
  ↓
  Load UserHighlights from localStorage
  ↓
  Initialize PlaybackState
  ↓
  Render video player + subtitles
  
[FAILURE: No native subtitles]
  ↓
  Check IndexedDB cache for video
  ↓
  [CACHE HIT]
    ↓
    Load cached SubtitleSegments (source='speech')
    ↓
    Display with "AI生成字幕" label
    ↓
    Continue to playback
  
  [CACHE MISS]
    ↓
    Create SpeechRecognitionTask (status='pending')
    ↓
    Display "正在生成字幕..." UI
    ↓
    API call: Extract audio (status='extracting')
    ↓
    Update progress (0-30%)
    ↓
    API call: Transcribe with Whisper (status='transcribing')
    ↓
    Update progress (30-100%)
    ↓
    Parse Whisper response
    ↓
    Create SubtitleSegment entities (source='speech', with confidence)
    ↓
    Save to IndexedDB cache
    ↓
    Update task (status='completed')
    ↓
    Hide progress UI, show subtitles
    ↓
    Load UserHighlights from localStorage
    ↓
    Initialize PlaybackState
    ↓
    Render video player + subtitles
    
  [ERROR]
    ↓
    Update task (status='failed', errorMessage)
    ↓
    Display error message to user
    ↓
    Offer retry option
```

### 2. Highlight Management Flow

```
User clicks subtitle segment
  ↓
Check if segment already highlighted
  ↓
If highlighted: Remove from highlights
If not: Create new UserHighlight
  ↓
Update highlights in Zustand store
  ↓
Persist to localStorage
  ↓
Re-render affected components
```

### 3. Playback Sync Flow

```
Video player fires timeupdate event
  ↓
Update PlaybackState.currentTime
  ↓
Compute active subtitle (debounced)
  ↓
Update PlaybackState.activeSegmentId
  ↓
Trigger re-render of SubtitleDisplay
  ↓
Scroll to active segment (if needed)
```

---

## Validation Rules Summary

### Video Validation
- URL must be valid Bilibili URL
- ID must match BV or AV format
- Duration must be positive if provided

### SubtitleSegment Validation
- Start time < end time
- No negative timestamps
- Text must be non-empty
- Index must be sequential

### UserHighlight Validation
- Must reference existing video and segment
- Created timestamp must be valid date
- Color must be valid hex code if provided

### PlaybackState Validation
- Current time within [0, duration]
- Playback rate within [0.25, 2.0]
- Volume within [0.0, 1.0]

---

## Storage Schema

### localStorage Keys

| Key | Value Type | Description | Example |
|-----|------------|-------------|---------|
| `highlights:{videoId}` | UserHighlight[] | User highlights for specific video | `highlights:BV1xx411c7mD` |
| `app:preferences` | AppPreferences | User preferences (future) | `{theme: 'dark'}` |

### localStorage Data Example

```json
{
  "highlights:BV1xx411c7mD": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "videoId": "BV1xx411c7mD",
      "segmentId": "subtitle-42",
      "createdAt": "2025-11-19T10:30:00.000Z",
      "color": "#FFEB3B"
    }
  ]
}
```

---

## Error States

### Video Errors
- `VIDEO_NOT_FOUND`: Invalid video ID or video removed
- `VIDEO_RESTRICTED`: Region-locked or login required
- `EMBED_BLOCKED`: Embedding disabled for video

### Subtitle Errors
- `NO_SUBTITLES`: Video has no subtitle tracks
- `SUBTITLE_FETCH_FAILED`: Network error fetching subtitles
- `SUBTITLE_PARSE_ERROR`: Malformed subtitle data

### Speech Recognition Errors
- `AUDIO_EXTRACTION_FAILED`: Failed to extract audio from video
- `AUDIO_TOO_LARGE`: Audio file exceeds size limit (>25MB)
- `AUDIO_TOO_LONG`: Video duration exceeds limit (>2 hours)
- `API_QUOTA_EXCEEDED`: Whisper API quota exceeded
- `API_ERROR`: Whisper API returned error
- `RECOGNITION_FAILED`: Speech recognition failed
- `NETWORK_ERROR`: Network error during recognition

### Storage Errors
- `QUOTA_EXCEEDED`: localStorage quota exceeded
- `STORAGE_UNAVAILABLE`: localStorage disabled or unavailable
- `INDEXEDDB_ERROR`: IndexedDB operation failed

---

## Type Definitions Summary

```typescript
// types/video.ts
export interface Video {
  id: string
  url: string
  title?: string
  duration?: number
  cid?: string
  embedUrl: string
  loadedAt: Date
}

// types/subtitle.ts
export interface SubtitleSegment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  text: string
  index: number
  language?: string
  source: 'native' | 'speech'
  confidence?: number // 0-1, only for speech-generated
}

// types/highlight.ts
export interface UserHighlight {
  id: string
  videoId: string
  segmentId: string
  createdAt: Date
  color?: string
}

// types/playback.ts
export interface PlaybackState {
  videoId: string
  currentTime: number
  isPlaying: boolean
  activeSegmentId: string | null
  playbackRate?: number
  volume?: number
}

// types/errors.ts
export type VideoError =
  | 'VIDEO_NOT_FOUND'
  | 'VIDEO_RESTRICTED'
  | 'EMBED_BLOCKED'

export type SubtitleError =
  | 'NO_SUBTITLES'
  | 'SUBTITLE_FETCH_FAILED'
  | 'SUBTITLE_PARSE_ERROR'

export type SpeechRecognitionError =
  | 'AUDIO_EXTRACTION_FAILED'
  | 'AUDIO_TOO_LARGE'
  | 'AUDIO_TOO_LONG'
  | 'API_QUOTA_EXCEEDED'
  | 'API_ERROR'
  | 'RECOGNITION_FAILED'
  | 'NETWORK_ERROR'

export type StorageError =
  | 'QUOTA_EXCEEDED'
  | 'STORAGE_UNAVAILABLE'
  | 'INDEXEDDB_ERROR'

// types/speechRecognition.ts
export type TaskStatus = 'pending' | 'extracting' | 'transcribing' | 'completed' | 'failed'

export interface SpeechRecognitionTask {
  id: string
  videoId: string
  status: TaskStatus
  progress: number
  startedAt: Date
  completedAt?: Date
  errorMessage?: string
  estimatedTimeRemaining?: number
  audioDuration?: number
}

export interface SubtitleCache {
  videoId: string
  subtitles: SubtitleSegment[]
  source: 'native' | 'speech'
  createdAt: Date
  expiresAt: Date
  audioSize?: number
  recognitionDuration?: number
}
```

---

## Indexes and Performance

### In-Memory Indexes (Zustand Store)

- **Subtitle by ID**: `Map<string, SubtitleSegment>` for O(1) lookup
- **Highlights by Segment**: `Map<string, UserHighlight>` for O(1) highlight check
- **Subtitles by Time**: Sorted array for binary search in sync logic

### localStorage Optimization

- Store highlights per video (not global) to minimize parse time
- Lazy load highlights only when video is loaded
- Debounce writes to avoid excessive localStorage operations

---

## Migration Strategy

### Future Schema Changes

If data model changes are needed:

1. Version localStorage keys: `highlights:v2:{videoId}`
2. Implement migration function to transform old data
3. Run migration on app load
4. Keep backward compatibility for 1 version

### Example Migration

```typescript
function migrateHighlights(videoId: string): void {
  const oldKey = `highlights:${videoId}`
  const newKey = `highlights:v2:${videoId}`

  const oldData = localStorage.getItem(oldKey)
  if (oldData) {
    const migrated = transformHighlights(JSON.parse(oldData))
    localStorage.setItem(newKey, JSON.stringify(migrated))
    localStorage.removeItem(oldKey)
  }
}
```
