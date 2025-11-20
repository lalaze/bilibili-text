# API Routes Contract

**Feature**: Bilibili Video Subtitle Synchronization
**Date**: 2025-11-19

## Overview

This document defines the Next.js API route contracts for the application. These routes act as a proxy to bypass CORS restrictions when fetching data from Bilibili's API.

---

## Route: GET /api/bilibili/video

Fetches video metadata from Bilibili.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| videoId | string | Yes | Bilibili video ID (BV or AV format) | `BV1xx411c7mD` |

**Example Request**:
```
GET /api/bilibili/video?videoId=BV1xx411c7mD
```

### Response

**Success (200)**:

```typescript
{
  id: string          // Video ID
  title: string       // Video title
  duration: number    // Duration in seconds
  cid: string         // Content ID (needed for subtitles)
  embedUrl: string    // Iframe embed URL
}
```

**Example**:
```json
{
  "id": "BV1xx411c7mD",
  "title": "Sample Video Title",
  "duration": 600,
  "cid": "123456789",
  "embedUrl": "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&cid=123456789"
}
```

**Error Responses**:

| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_VIDEO_ID | Invalid video ID format | Video ID doesn't match BV/AV pattern |
| 404 | VIDEO_NOT_FOUND | Video not found | Video doesn't exist or is deleted |
| 403 | VIDEO_RESTRICTED | Video is restricted | Region-locked or login required |
| 500 | FETCH_FAILED | Failed to fetch video data | Network or API error |

**Error Response Format**:
```typescript
{
  error: {
    code: string
    message: string
    details?: string
  }
}
```

---

## Route: GET /api/bilibili/subtitles

Fetches subtitle data for a video.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| videoId | string | Yes | Bilibili video ID | `BV1xx411c7mD` |
| cid | string | Yes | Content ID from video metadata | `123456789` |
| lang | string | No | Preferred language code | `zh-CN` |

**Example Request**:
```
GET /api/bilibili/subtitles?videoId=BV1xx411c7mD&cid=123456789&lang=zh-CN
```

### Response

**Success (200)**:

```typescript
{
  videoId: string
  tracks: Array<{
    lang: string      // Language code
    langDoc: string   // Language display name
    url: string       // Subtitle file URL
  }>
  subtitles: Array<{
    id: string
    startTime: number
    endTime: number
    text: string
    index: number
  }>
}
```

**Example**:
```json
{
  "videoId": "BV1xx411c7mD",
  "tracks": [
    {
      "lang": "zh-CN",
      "langDoc": "中文（中国）",
      "url": "https://..."
    }
  ],
  "subtitles": [
    {
      "id": "subtitle-0",
      "startTime": 0.0,
      "endTime": 2.5,
      "text": "Hello world",
      "index": 0
    },
    {
      "id": "subtitle-1",
      "startTime": 2.5,
      "endTime": 5.0,
      "text": "Welcome to the video",
      "index": 1
    }
  ]
}
```

**Error Responses**:

| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_PARAMS | Invalid parameters | Missing or invalid videoId/cid |
| 404 | NO_SUBTITLES | No subtitles available | Video has no subtitle tracks |
| 500 | SUBTITLE_FETCH_FAILED | Failed to fetch subtitles | Network or parsing error |

---

## Route: POST /api/bilibili/validate-url

Validates a Bilibili video URL and extracts the video ID.

### Request

**Method**: `POST`

**Body**:

```typescript
{
  url: string  // Full Bilibili video URL
}
```

**Example Request**:
```json
{
  "url": "https://www.bilibili.com/video/BV1xx411c7mD"
}
```

### Response

**Success (200)**:

```typescript
{
  valid: boolean
  videoId: string | null
  urlType: 'BV' | 'AV' | null
}
```

**Example**:
```json
{
  "valid": true,
  "videoId": "BV1xx411c7mD",
  "urlType": "BV"
}
```

**Invalid URL (200)**:
```json
{
  "valid": false,
  "videoId": null,
  "urlType": null
}
```

---

## Route: POST /api/bilibili/speech/transcribe

Initiates speech recognition for a video without native subtitles.

### Request

**Method**: `POST`

**Body**:

```typescript
{
  videoId: string  // Bilibili video ID
  cid: string      // Content ID
  language?: string // Target language (default: 'zh')
}
```

**Example Request**:
```json
{
  "videoId": "BV1xx411c7mD",
  "cid": "123456789",
  "language": "zh"
}
```

### Response

**Success (200)** - Task Created:

```typescript
{
  taskId: string              // Unique task identifier
  videoId: string
  status: 'pending' | 'extracting' | 'transcribing'
  progress: number            // 0-100
  estimatedDuration: number   // Estimated seconds to complete
}
```

**Example**:
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "videoId": "BV1xx411c7mD",
  "status": "pending",
  "progress": 0,
  "estimatedDuration": 180
}
```

**Success (200)** - Cached Result:

```typescript
{
  taskId: null
  videoId: string
  status: 'completed'
  progress: 100
  subtitles: SubtitleSegment[]  // From cache
  source: 'cache'
}
```

**Error Responses**:

| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_PARAMS | Invalid parameters | Missing videoId or cid |
| 413 | AUDIO_TOO_LARGE | Audio file too large | Exceeds 25MB limit |
| 413 | AUDIO_TOO_LONG | Video too long | Exceeds 2 hour limit |
| 500 | AUDIO_EXTRACTION_FAILED | Failed to extract audio | Cannot get audio from video |
| 503 | API_QUOTA_EXCEEDED | API quota exceeded | Whisper API rate limit hit |
| 500 | API_ERROR | Speech recognition failed | Whisper API error |

---

## Route: GET /api/bilibili/speech/status

Checks the status of an ongoing speech recognition task.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | Yes | Task identifier from transcribe endpoint | `550e8400-...` |

**Example Request**:
```
GET /api/bilibili/speech/status?taskId=550e8400-e29b-41d4-a716-446655440000
```

### Response

**Success (200)** - In Progress:

```typescript
{
  taskId: string
  videoId: string
  status: 'pending' | 'extracting' | 'transcribing'
  progress: number            // 0-100
  startedAt: string           // ISO 8601 timestamp
  estimatedTimeRemaining: number // Seconds
  audioDuration?: number      // Total audio duration (available after extraction)
}
```

**Example**:
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "videoId": "BV1xx411c7mD",
  "status": "transcribing",
  "progress": 65,
  "startedAt": "2025-11-20T10:30:00Z",
  "estimatedTimeRemaining": 45,
  "audioDuration": 300
}
```

**Success (200)** - Completed:

```typescript
{
  taskId: string
  videoId: string
  status: 'completed'
  progress: 100
  startedAt: string
  completedAt: string         // ISO 8601 timestamp
  subtitles: SubtitleSegment[] // Generated subtitles
}
```

**Example**:
```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "videoId": "BV1xx411c7mD",
  "status": "completed",
  "progress": 100,
  "startedAt": "2025-11-20T10:30:00Z",
  "completedAt": "2025-11-20T10:33:45Z",
  "subtitles": [
    {
      "id": "subtitle-0",
      "videoId": "BV1xx411c7mD",
      "startTime": 0.0,
      "endTime": 3.5,
      "text": "欢迎来到这个视频",
      "index": 0,
      "source": "speech",
      "confidence": 0.95
    }
  ]
}
```

**Success (200)** - Failed:

```typescript
{
  taskId: string
  videoId: string
  status: 'failed'
  progress: number            // Progress when failed
  startedAt: string
  completedAt: string
  errorMessage: string        // Error description
  errorCode: string          // Machine-readable error code
}
```

**Error Responses**:

| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 404 | TASK_NOT_FOUND | Task not found | Invalid taskId or task expired |
| 500 | FETCH_FAILED | Failed to fetch status | Server error |

---

## Route: GET /api/bilibili/speech/cache

Checks if a video has cached speech recognition results.

### Request

**Method**: `GET`

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| videoId | string | Yes | Bilibili video ID | `BV1xx411c7mD` |

**Example Request**:
```
GET /api/bilibili/speech/cache?videoId=BV1xx411c7mD
```

### Response

**Success (200)** - Cache Exists:

```typescript
{
  cached: boolean
  videoId: string
  createdAt: string          // ISO 8601 timestamp
  expiresAt: string          // ISO 8601 timestamp
  subtitleCount: number      // Number of subtitle segments
}
```

**Example**:
```json
{
  "cached": true,
  "videoId": "BV1xx411c7mD",
  "createdAt": "2025-11-19T10:30:00Z",
  "expiresAt": "2025-12-19T10:30:00Z",
  "subtitleCount": 150
}
```

**Success (200)** - No Cache:

```json
{
  "cached": false,
  "videoId": "BV1xx411c7mD"
}
```

---

## Client Service Contracts

These are the TypeScript interfaces for the client-side services that call the API routes.

### BilibiliService

```typescript
interface BilibiliService {
  /**
   * Validates a Bilibili video URL
   * @throws {ValidationError} If URL format is invalid
   */
  validateUrl(url: string): Promise<{
    valid: boolean
    videoId: string | null
  }>

  /**
   * Fetches video metadata
   * @throws {VideoNotFoundError} If video doesn't exist
   * @throws {VideoRestrictedError} If video is restricted
   * @throws {NetworkError} If fetch fails
   */
  fetchVideoMetadata(videoId: string): Promise<VideoMetadata>

  /**
   * Fetches subtitle data for a video
   * @throws {NoSubtitlesError} If video has no subtitles
   * @throws {SubtitleFetchError} If fetch fails
   */
  fetchSubtitles(videoId: string, cid: string): Promise<SubtitleData>
}
```

### StorageService

```typescript
interface StorageService {
  /**
   * Saves user highlights for a video
   * @throws {QuotaExceededError} If localStorage quota exceeded
   */
  saveHighlights(videoId: string, highlights: UserHighlight[]): void

  /**
   * Loads user highlights for a video
   * @returns Empty array if no highlights found
   */
  loadHighlights(videoId: string): UserHighlight[]

  /**
   * Clears all highlights for a video
   */
  clearHighlights(videoId: string): void

  /**
   * Checks if storage is available
   */
  isAvailable(): boolean
}
```

### IndexedDBService

```typescript
interface IndexedDBService {
  /**
   * Initializes the IndexedDB database
   * @throws {IndexedDBError} If initialization fails
   */
  initialize(): Promise<void>

  /**
   * Saves subtitle cache for a video
   * @throws {IndexedDBError} If save fails
   */
  saveSubtitleCache(cache: SubtitleCache): Promise<void>

  /**
   * Loads subtitle cache for a video
   * @returns null if no cache found or expired
   */
  loadSubtitleCache(videoId: string): Promise<SubtitleCache | null>

  /**
   * Checks if a video has valid cache
   */
  hasCachedSubtitles(videoId: string): Promise<boolean>

  /**
   * Clears expired cache entries
   * @returns Number of entries cleared
   */
  clearExpiredCache(): Promise<number>

  /**
   * Clears all cache
   */
  clearAllCache(): Promise<void>

  /**
   * Gets total cache size in bytes
   */
  getCacheSize(): Promise<number>
}
```

### SpeechRecognitionService

```typescript
interface SpeechRecognitionService {
  /**
   * Initiates speech recognition for a video
   * @returns Task ID for tracking progress, or null if using cache
   * @throws {AudioExtractionError} If audio extraction fails
   * @throws {AudioTooLargeError} If audio exceeds size limit
   * @throws {ApiQuotaExceededError} If API quota exceeded
   */
  transcribeVideo(videoId: string, cid: string, language?: string): Promise<{
    taskId: string | null
    status: TaskStatus
    subtitles?: SubtitleSegment[]
  }>

  /**
   * Checks status of a recognition task
   * @throws {TaskNotFoundError} If task doesn't exist
   */
  getTaskStatus(taskId: string): Promise<SpeechRecognitionTask>

  /**
   * Polls task status until completion
   * @param onProgress Callback for progress updates
   * @returns Completed subtitles
   * @throws {RecognitionFailedError} If recognition fails
   */
  waitForCompletion(
    taskId: string,
    onProgress?: (progress: number, status: TaskStatus) => void
  ): Promise<SubtitleSegment[]>

  /**
   * Checks if video has cached recognition results
   */
  hasCachedResult(videoId: string): Promise<boolean>

  /**
   * Cancels an ongoing recognition task (if supported)
   */
  cancelTask(taskId: string): Promise<void>
}
```

---

## Error Handling Contract

All API routes follow a consistent error response format:

```typescript
interface ApiError {
  error: {
    code: string        // Machine-readable error code
    message: string     // Human-readable error message
    details?: string    // Additional error details
    timestamp: string   // ISO 8601 timestamp
  }
}
```

### Error Codes

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| INVALID_VIDEO_ID | 400 | Video ID format invalid | Check URL format |
| INVALID_PARAMS | 400 | Missing or invalid parameters | Retry with valid params |
| VIDEO_NOT_FOUND | 404 | Video doesn't exist | Try different video |
| VIDEO_RESTRICTED | 403 | Video is region-locked | Use VPN or try different video |
| NO_SUBTITLES | 404 | No subtitle tracks available | Will trigger speech recognition |
| SUBTITLE_FETCH_FAILED | 500 | Failed to fetch subtitles | Retry later |
| FETCH_FAILED | 500 | Network or API error | Check connection, retry |
| QUOTA_EXCEEDED | 507 | localStorage quota exceeded | Clear old highlights |
| AUDIO_EXTRACTION_FAILED | 500 | Failed to extract audio | Video format not supported |
| AUDIO_TOO_LARGE | 413 | Audio exceeds 25MB limit | Video too long or high bitrate |
| AUDIO_TOO_LONG | 413 | Video exceeds 2 hour limit | Try shorter video |
| API_QUOTA_EXCEEDED | 503 | Whisper API quota exceeded | Wait and retry later |
| API_ERROR | 500 | Whisper API error | Retry later |
| RECOGNITION_FAILED | 500 | Speech recognition failed | Check audio quality |
| TASK_NOT_FOUND | 404 | Recognition task not found | Task expired or invalid ID |
| INDEXEDDB_ERROR | 500 | IndexedDB operation failed | Clear browser data |

---

## Rate Limiting

**Current**: No rate limiting (client-side only app)

**Future Consideration**: If backend is added, implement:
- 100 requests per minute per IP
- 429 status code when exceeded
- Retry-After header with seconds to wait

---

## CORS Configuration

API routes run server-side in Next.js, bypassing CORS restrictions:

```typescript
// No CORS headers needed for same-origin requests
// External Bilibili API calls happen server-side
```

---

## Caching Strategy

### Client-Side Caching

- **Video metadata**: Cache in memory for session duration
- **Native subtitles**: Cache in memory, no persistence (fetched from Bilibili each time)
- **Speech-generated subtitles**: Cache in IndexedDB for 30 days (expensive to generate)
- **User highlights**: Persist in localStorage, load on demand
- **Recognition tasks**: Keep in memory only (ephemeral)

### IndexedDB Cache Structure

Database: `bilibili-text-db`

**Object Store: `subtitle-cache`**
- Key: `videoId` (string)
- Indexes:
  - `expiresAt` (for cleanup)
  - `source` (for filtering)
- TTL: 30 days
- Auto-cleanup: On app load, clear expired entries

**Cache Size Management**:
- Target: <100MB total
- Per video: ~1-5MB
- If quota exceeded: Clear oldest entries first
- User control: Settings page to clear cache

### HTTP Caching

- API routes: No caching headers (dynamic data)
- Static assets: Next.js default caching (1 year)

---

## Testing Contracts

### Contract Tests Required

1. **API Route Tests**:
   - Valid requests return expected shape
   - Invalid requests return proper errors
   - Error codes match specification

2. **Service Tests**:
   - Services call correct API routes
   - Services handle errors correctly
   - Services transform data correctly

3. **Storage Tests**:
   - Save/load round-trip works
   - Quota exceeded handled gracefully
   - Invalid data handled safely

### Mock Data

```typescript
// __tests__/fixtures/video.ts
export const mockVideoMetadata = {
  id: 'BV1xx411c7mD',
  title: 'Test Video',
  duration: 600,
  cid: '123456789',
  embedUrl: 'https://player.bilibili.com/...'
}

// __tests__/fixtures/subtitles.ts
export const mockNativeSubtitles = [
  {
    id: 'subtitle-0',
    videoId: 'BV1xx411c7mD',
    startTime: 0,
    endTime: 2.5,
    text: 'Test subtitle',
    index: 0,
    source: 'native'
  }
]

export const mockSpeechSubtitles = [
  {
    id: 'subtitle-0',
    videoId: 'BV1xx411c7mD',
    startTime: 0,
    endTime: 3.5,
    text: '欢迎来到这个视频',
    index: 0,
    source: 'speech',
    confidence: 0.95
  },
  {
    id: 'subtitle-1',
    videoId: 'BV1xx411c7mD',
    startTime: 3.5,
    endTime: 7.0,
    text: '今天我们要讨论一个有趣的话题',
    index: 1,
    source: 'speech',
    confidence: 0.92
  }
]

// __tests__/fixtures/speechRecognition.ts
export const mockSpeechTask = {
  taskId: '550e8400-e29b-41d4-a716-446655440000',
  videoId: 'BV1xx411c7mD',
  status: 'transcribing',
  progress: 65,
  startedAt: new Date('2025-11-20T10:30:00Z'),
  audioDuration: 300,
  estimatedTimeRemaining: 45
}

export const mockCompletedTask = {
  ...mockSpeechTask,
  status: 'completed',
  progress: 100,
  completedAt: new Date('2025-11-20T10:33:45Z'),
  subtitles: mockSpeechSubtitles
}
```

---

## Versioning

**Current Version**: v1 (implicit, no version in URL)

**Future Versioning**: If breaking changes needed:
- Add version to route: `/api/v2/bilibili/video`
- Maintain v1 for backward compatibility
- Document migration path
