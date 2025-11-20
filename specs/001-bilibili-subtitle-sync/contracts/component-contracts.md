# Component Contracts

**Feature**: Bilibili Video Subtitle Synchronization
**Date**: 2025-11-19

## Overview

This document defines the interface contracts for React components, including props, callbacks, and behavior expectations.

---

## VideoPlayer Component

Embeds and controls the Bilibili video player.

### Props Contract

```typescript
interface VideoPlayerProps {
  videoId: string
  embedUrl: string
  onTimeUpdate: (currentTime: number) => void
  onPlayStateChange: (isPlaying: boolean) => void
  onError: (error: VideoError) => void
  className?: string
}
```

### Behavior Contract

**MUST**:
- Render iframe with provided embedUrl
- Fire onTimeUpdate at least every 250ms during playback
- Fire onPlayStateChange when play/pause state changes
- Fire onError if video fails to load
- Handle iframe communication for playback state

**MUST NOT**:
- Modify global state directly
- Make API calls
- Store playback state internally (controlled component)

### Events

| Event | Trigger | Payload | Frequency |
|-------|---------|---------|-----------|
| onTimeUpdate | Video playback progresses | currentTime: number | Every 250ms |
| onPlayStateChange | Play/pause button clicked | isPlaying: boolean | On change |
| onError | Video load fails | error: VideoError | Once per error |

### Example Usage

```tsx
<VideoPlayer
  videoId="BV1xx411c7mD"
  embedUrl="https://player.bilibili.com/..."
  onTimeUpdate={(time) => updatePlaybackTime(time)}
  onPlayStateChange={(playing) => setIsPlaying(playing)}
  onError={(error) => handleVideoError(error)}
/>
```

---

## SubtitleDisplay Component

Displays the list of subtitle segments with highlighting.

### Props Contract

```typescript
interface SubtitleDisplayProps {
  subtitles: SubtitleSegment[]
  activeSegmentId: string | null
  highlightedSegmentIds: Set<string>
  onSegmentClick: (segmentId: string) => void
  className?: string
}
```

### Behavior Contract

**MUST**:
- Render all subtitle segments in order
- Highlight active segment (playback-driven)
- Show user highlights with distinct styling
- Scroll to active segment automatically
- Handle clicks on segments
- Virtualize list for 1000+ segments

**MUST NOT**:
- Modify subtitle data
- Manage highlight state internally
- Make API calls

### Accessibility

- Use semantic HTML (ul/li or article)
- ARIA label: "Video subtitles"
- Active segment: aria-current="true"
- Keyboard navigation: Tab through segments

### Example Usage

```tsx
<SubtitleDisplay
  subtitles={subtitles}
  activeSegmentId="subtitle-42"
  highlightedSegmentIds={new Set(['subtitle-10', 'subtitle-20'])}
  onSegmentClick={(id) => toggleHighlight(id)}
/>
```

---

## SubtitleSegment Component

Individual subtitle segment with text and timing.

### Props Contract

```typescript
interface SubtitleSegmentProps {
  segment: SubtitleSegment
  isActive: boolean
  isHighlighted: boolean
  onClick: (segmentId: string) => void
  className?: string
}
```

### Behavior Contract

**MUST**:
- Display segment text
- Show timing information (optional)
- Apply active styling when isActive=true
- Apply highlight styling when isHighlighted=true
- Handle click events
- Be memoized (React.memo) for performance

**MUST NOT**:
- Fetch or modify data
- Manage internal state

### Styling States

| State | Visual | CSS Class |
|-------|--------|-----------|
| Default | Normal text | `subtitle-segment` |
| Active | Yellow background | `subtitle-segment--active` |
| Highlighted | Blue border | `subtitle-segment--highlighted` |
| Active + Highlighted | Both styles | Both classes |

### Example Usage

```tsx
<SubtitleSegment
  segment={segment}
  isActive={activeId === segment.id}
  isHighlighted={highlights.has(segment.id)}
  onClick={(id) => handleClick(id)}
/>
```

---

## VideoUrlInput Component

Form for entering and validating Bilibili video URLs.

### Props Contract

```typescript
interface VideoUrlInputProps {
  onSubmit: (videoId: string, url: string) => void
  onError: (error: string) => void
  isLoading?: boolean
  className?: string
}
```

### Behavior Contract

**MUST**:
- Validate URL format on submit
- Show loading state during validation
- Display error messages inline
- Clear error on input change
- Disable submit during loading
- Support Enter key submission

**MUST NOT**:
- Navigate directly (use callback)
- Store video data

### Validation Rules

- URL must contain "bilibili.com"
- URL must contain video ID (BV or av)
- URL must be valid HTTP/HTTPS

### Example Usage

```tsx
<VideoUrlInput
  onSubmit={(videoId, url) => loadVideo(videoId, url)}
  onError={(error) => showError(error)}
  isLoading={isValidating}
/>
```

---

## ErrorMessage Component

Displays error messages with appropriate styling.

### Props Contract

```typescript
interface ErrorMessageProps {
  error: AppError | null
  onDismiss?: () => void
  className?: string
}
```

### Behavior Contract

**MUST**:
- Show error message if error is not null
- Hide if error is null
- Show dismiss button if onDismiss provided
- Use appropriate ARIA roles (role="alert")
- Auto-dismiss after 5 seconds (optional)

### Error Types

| Error Type | Icon | Color | Action |
|------------|------|-------|--------|
| VIDEO_NOT_FOUND | ⚠️ | Yellow | Retry with different URL |
| NETWORK_ERROR | ❌ | Red | Retry |
| NO_SUBTITLES | ℹ️ | Blue | Informational only |

### Example Usage

```tsx
<ErrorMessage
  error={error}
  onDismiss={() => clearError()}
/>
```

---

## Hook Contracts

### useVideoPlayer Hook

Manages video playback state.

```typescript
interface UseVideoPlayerReturn {
  currentTime: number
  isPlaying: boolean
  duration: number
  setCurrentTime: (time: number) => void
  togglePlay: () => void
  seek: (time: number) => void
}

function useVideoPlayer(videoId: string): UseVideoPlayerReturn
```

**Behavior**:
- Syncs with VideoPlayer component
- Debounces time updates (100ms)
- Persists playback state in Zustand

---

### useSubtitles Hook

Fetches and manages subtitle data.

```typescript
interface UseSubtitlesReturn {
  subtitles: SubtitleSegment[]
  isLoading: boolean
  error: SubtitleError | null
  refetch: () => Promise<void>
}

function useSubtitles(
  videoId: string,
  cid: string
): UseSubtitlesReturn
```

**Behavior**:
- Fetches subtitles on mount
- Caches in memory
- Handles errors gracefully
- Supports manual refetch

---

### useSubtitleSync Hook

Synchronizes active subtitle with playback.

```typescript
interface UseSubtitleSyncReturn {
  activeSegmentId: string | null
  scrollToActive: () => void
}

function useSubtitleSync(
  currentTime: number,
  subtitles: SubtitleSegment[]
): UseSubtitleSyncReturn
```

**Behavior**:
- Computes active segment from time
- Debounces computation (100ms)
- Provides scroll helper
- Memoizes result

---

### useHighlights Hook

Manages user highlight persistence.

```typescript
interface UseHighlightsReturn {
  highlights: Set<string>
  toggleHighlight: (segmentId: string) => void
  clearHighlights: () => void
  isHighlighted: (segmentId: string) => boolean
}

function useHighlights(videoId: string): UseHighlightsReturn
```

**Behavior**:
- Loads from localStorage on mount
- Persists changes immediately
- Handles quota exceeded errors
- Provides helper methods

---

## State Management Contracts

### Zustand Store

```typescript
interface VideoStore {
  // State
  videoId: string | null
  currentTime: number
  isPlaying: boolean
  subtitles: SubtitleSegment[]
  highlights: Set<string>
  activeSegmentId: string | null
  error: AppError | null

  // Actions
  setVideoId: (id: string) => void
  updateTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  loadSubtitles: (subtitles: SubtitleSegment[]) => void
  toggleHighlight: (segmentId: string) => void
  setActiveSegment: (id: string | null) => void
  setError: (error: AppError | null) => void
  reset: () => void
}
```

**Behavior**:
- Single source of truth for app state
- Actions are synchronous
- Persistence handled by hooks, not store
- Selectors for derived state

---

## Testing Contracts

### Component Testing

Each component must have tests for:

1. **Rendering**: Renders with valid props
2. **Props**: Handles all prop variations
3. **Events**: Fires callbacks correctly
4. **Accessibility**: ARIA labels, keyboard nav
5. **Edge Cases**: Empty data, errors, loading

### Example Test Structure

```typescript
describe('SubtitleSegment', () => {
  it('renders segment text', () => {
    // Test basic rendering
  })

  it('applies active styling when isActive=true', () => {
    // Test active state
  })

  it('calls onClick with segment ID', () => {
    // Test click handler
  })

  it('has proper ARIA attributes', () => {
    // Test accessibility
  })
})
```

---

## Performance Contracts

### Component Performance

| Component | Max Render Time | Optimization |
|-----------|----------------|--------------|
| VideoPlayer | <50ms | Memo, lazy load |
| SubtitleDisplay | <100ms | Virtualization |
| SubtitleSegment | <10ms | React.memo |
| VideoUrlInput | <20ms | Debounced validation |

### Re-render Optimization

- Use React.memo for pure components
- Use useMemo for expensive computations
- Use useCallback for event handlers
- Avoid inline object/array creation in props

---

## Error Boundary Contract

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}
```

**Behavior**:
- Catch rendering errors
- Display fallback UI
- Log errors to console
- Allow recovery (reset button)

---

## Summary

All components follow these principles:

1. **Controlled**: State managed externally
2. **Pure**: Same props = same output
3. **Accessible**: ARIA labels, keyboard support
4. **Performant**: Memoized, optimized
5. **Testable**: Clear contracts, mockable
6. **Type-safe**: Full TypeScript coverage
