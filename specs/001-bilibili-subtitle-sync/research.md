# Research: Bilibili Video Subtitle Synchronization

**Date**: 2025-11-19
**Feature**: 001-bilibili-subtitle-sync

## Research Questions

This document resolves the NEEDS CLARIFICATION items from the Technical Context:

1. Bilibili subtitle extraction method
2. Contract testing approach for Next.js application

---

## 1. Bilibili Subtitle Extraction Method

### Decision

Use Bilibili's public API endpoint to fetch subtitle data: `https://api.bilibili.com/x/player/v2` with video BV/AV ID, combined with subtitle file URLs from the response.

### Rationale

- **Official API**: Bilibili provides a player API that returns subtitle track URLs
- **Structured Data**: Returns JSON with subtitle metadata (language, URL)
- **No Scraping**: Avoids fragile HTML parsing that breaks with UI changes
- **CORS Handling**: Use Next.js API routes as proxy to bypass CORS restrictions
- **Format**: Subtitles are in JSON format with timing data (start, end, content)

### Implementation Approach

```typescript
// API Route: app/api/bilibili/subtitles/route.ts
// Fetches subtitle data from Bilibili API
// Returns: { tracks: [{ lang, url }], subtitles: SubtitleSegment[] }

// Client-side: services/bilibili.ts
// Calls Next.js API route to get subtitle data
// Parses subtitle JSON format into app data model
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| HTML Scraping | No API dependency | Fragile, breaks with UI changes, complex parsing | High maintenance, unreliable |
| Third-party APIs | Easier integration | External dependency, rate limits, cost | Adds unnecessary complexity |
| Manual Upload | Simple implementation | Poor UX, defeats purpose | Doesn't meet requirement of URL-based loading |
| Browser Extension | Direct access to page data | Requires extension install, limited distribution | Not a web app, deployment complexity |

### Technical Details

**Bilibili API Endpoint Structure**:
- Player API: `https://api.bilibili.com/x/player/v2?bvid={BV_ID}&cid={CID}`
- Returns subtitle track list with URLs
- Subtitle files are JSON: `[{from, to, content}]` format
- Need to extract BV/AV ID and CID from video URL

**URL Parsing**:
- Format: `https://www.bilibili.com/video/BV{id}`
- Extract BV ID from URL
- Fetch video info to get CID (content ID)
- Use BV + CID to fetch subtitle data

**CORS Solution**:
- Create Next.js API route at `/api/bilibili/subtitles`
- Server-side fetch to Bilibili API (no CORS)
- Return processed data to client

---

## 2. Contract Testing Approach

### Decision

Use **Jest with contract test pattern** for localStorage interface and external API boundaries. Focus on testing the contracts between layers rather than full E2E API mocking.

### Rationale

- **Lightweight**: No additional testing framework needed (Jest already in stack)
- **Fast Execution**: Contract tests run quickly in CI/CD
- **Clear Boundaries**: Tests verify interface contracts, not implementation
- **localStorage Focus**: Primary external dependency is browser storage
- **API Mocking**: Mock Bilibili API responses with realistic fixtures

### Implementation Approach

```typescript
// __tests__/contract/storage.contract.test.ts
// Tests localStorage interface contract
// Verifies: save, load, delete operations
// Uses: jest.spyOn(Storage.prototype)

// __tests__/contract/bilibili-api.contract.test.ts
// Tests Bilibili API service contract
// Verifies: request/response shape, error handling
// Uses: MSW (Mock Service Worker) for API mocking
```

### Contract Test Coverage

1. **Storage Contract**:
   - Save highlights: `saveHighlights(videoId, highlights) => void`
   - Load highlights: `loadHighlights(videoId) => Highlight[]`
   - Clear highlights: `clearHighlights(videoId) => void`
   - Error handling: quota exceeded, parse errors

2. **Bilibili API Contract**:
   - Fetch subtitles: `fetchSubtitles(videoId) => SubtitleData`
   - Parse response: validate JSON structure
   - Error handling: network errors, invalid video ID, no subtitles

3. **Component Contracts**:
   - VideoPlayer: `onTimeUpdate(time) => void`
   - SubtitleDisplay: `onSegmentClick(segmentId) => void`
   - Props validation and callback contracts

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Pact (Consumer-Driven) | Industry standard, powerful | Overkill for client-only app, steep learning curve | No backend to contract with |
| OpenAPI + Prism | Auto-generated mocks | Requires OpenAPI spec, complex setup | Bilibili API not under our control |
| Full E2E only | Real integration testing | Slow, flaky, expensive | Need fast feedback for TDD |
| No contract tests | Simpler test suite | Misses integration issues | Violates constitution testing standards |

### Testing Strategy Summary

- **Unit Tests**: Components, hooks, utilities (Jest + RTL)
- **Contract Tests**: Storage interface, API boundaries (Jest + MSW)
- **Integration Tests**: User flows, multi-component interactions (Playwright)
- **Coverage Target**: 80%+ per constitution

---

## 3. State Management: Zustand

### Decision

Use **Zustand** for global state management (video playback state, subtitle data, highlights).

### Rationale

- **Lightweight**: ~1KB, minimal boilerplate
- **TypeScript**: Excellent TypeScript support
- **React Integration**: Simple hooks-based API
- **Performance**: No unnecessary re-renders
- **DevTools**: Redux DevTools integration available
- **Learning Curve**: Minimal, intuitive API

### State Structure

```typescript
// stores/videoStore.ts
interface VideoStore {
  videoId: string | null
  currentTime: number
  isPlaying: boolean
  subtitles: SubtitleSegment[]
  highlights: Set<string>
  activeSegmentId: string | null

  setVideoId: (id: string) => void
  updateTime: (time: number) => void
  togglePlay: () => void
  loadSubtitles: (subtitles: SubtitleSegment[]) => void
  toggleHighlight: (segmentId: string) => void
}
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| React Context | Built-in, no dependency | Performance issues, boilerplate | Re-render problems with frequent updates |
| Redux Toolkit | Industry standard, powerful | Heavy, overkill for simple app | Too much boilerplate for small app |
| Jotai | Atomic state, flexible | Less mature, smaller ecosystem | Zustand simpler for our use case |
| useState only | Simplest | Prop drilling, hard to share state | Poor DX for cross-component state |

---

## 4. Subtitle Format Parsing

### Decision

Parse Bilibili's JSON subtitle format: `[{from: number, to: number, content: string}]` into internal data model.

### Rationale

- **Native Format**: Bilibili uses JSON, no conversion needed
- **Timing Data**: Includes start (from) and end (to) timestamps in seconds
- **Simple Structure**: Easy to parse and validate
- **No Dependencies**: Native JSON.parse sufficient

### Parser Implementation

```typescript
interface BilibiliSubtitle {
  from: number    // Start time in seconds
  to: number      // End time in seconds
  content: string // Subtitle text
}

interface SubtitleSegment {
  id: string
  startTime: number
  endTime: number
  text: string
}

function parseSubtitles(raw: BilibiliSubtitle[]): SubtitleSegment[] {
  return raw.map((item, index) => ({
    id: `subtitle-${index}`,
    startTime: item.from,
    endTime: item.to,
    text: item.content
  }))
}
```

### Edge Cases Handled

- Empty subtitle array
- Missing timing data (skip segment)
- Malformed JSON (error boundary)
- Overlapping timestamps (keep as-is, UI handles)
- Very long text (CSS truncation with expand option)

---

## 5. Performance Optimization Strategy

### Decision

Implement **virtualization for subtitle list** and **debounced playback sync** to handle 1000+ segments efficiently.

### Rationale

- **Virtualization**: Only render visible subtitle segments (react-window)
- **Debouncing**: Limit sync checks to every 100ms instead of every frame
- **Memoization**: React.memo for SubtitleSegment components
- **Lazy Loading**: Code-split video page with Next.js dynamic imports

### Implementation

```typescript
// components/SubtitleDisplay.tsx
import { FixedSizeList } from 'react-window'

// Render only visible items
<FixedSizeList
  height={600}
  itemCount={subtitles.length}
  itemSize={60}
  width="100%"
>
  {SubtitleSegmentRow}
</FixedSizeList>

// hooks/useSubtitleSync.ts
// Debounce time updates
const debouncedTime = useDebouncedValue(currentTime, 100)
```

### Performance Budgets

- Initial load: <2s (per success criteria)
- Time to interactive: <3s
- Subtitle sync delay: <500ms (per success criteria)
- Highlight interaction: <100ms (per success criteria)
- Memory: <50MB for 1000 segments

---

## 6. Accessibility Strategy

### Decision

Implement **WCAG 2.1 Level AA** compliance with keyboard navigation, ARIA labels, and screen reader support.

### Rationale

- **Constitution Requirement**: UX consistency principle requires accessibility
- **Keyboard Navigation**: Tab through segments, Enter to highlight, Space to play/pause
- **ARIA Labels**: Proper roles and labels for video player and subtitle list
- **Focus Management**: Visible focus indicators, logical tab order
- **Color Contrast**: 4.5:1 minimum for text, 3:1 for UI components

### Implementation Checklist

- [ ] Semantic HTML (button, nav, main, article)
- [ ] ARIA labels for video player controls
- [ ] Keyboard shortcuts documented
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announcements for state changes
- [ ] Color contrast validation with tools
- [ ] Skip to content link
- [ ] Reduced motion support (prefers-reduced-motion)

---

---

## 7. Speech Recognition for Videos Without Subtitles

### Decision

采用**云端语音识别服务（OpenAI Whisper API）**作为主要方案，通过Next.js API路由处理音频提取和识别任务。

### Rationale

- **准确性**: Whisper模型在中文识别上表现优异（WER <5%）
- **时间戳支持**: 自动生成带时间戳的字幕段落
- **多语言支持**: 支持中英混合识别
- **API成本**: $0.006/分钟，可接受的成本
- **无需客户端资源**: 服务端处理，不占用用户浏览器资源
- **稳定性**: 云服务比浏览器API更可靠

### Implementation Approach

```typescript
// app/api/bilibili/speech/route.ts
// 1. 接收视频URL
// 2. 提取音频流（使用yt-dlp或类似工具）
// 3. 将音频发送到Whisper API
// 4. 解析识别结果，生成SubtitleSegment[]
// 5. 缓存到IndexedDB避免重复识别

// Flow:
// Client → Next.js API → 提取音频 → Whisper API → 返回字幕
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| Web Speech API | 免费，无后端 | 准确率低（<80%），无中文优化，无时间戳，浏览器兼容性差 | 不满足质量要求 |
| Google Cloud Speech-to-Text | 高准确率，成熟服务 | 成本高（$0.024/min），需要GCP账户，配置复杂 | 成本过高，OpenAI更简单 |
| 本地Whisper模型 | 无API成本，隐私好 | 需要GPU服务器，部署复杂，延迟高 | 项目无服务器基础设施 |
| AssemblyAI | 专注语音识别 | 成本略高，功能过多 | OpenAI足够满足需求 |

### Technical Details

**音频提取方案**:
- 使用**Bilibili API**获取音频流URL
- 或使用**you-get/yt-dlp** Python工具提取音频
- 将音频转换为Whisper支持的格式（MP3/M4A/WAV）
- 限制音频长度（<25MB或<2小时）

**API集成**:
```typescript
// services/speechRecognition.ts
async function transcribeAudio(audioUrl: string): Promise<SubtitleSegment[]> {
  // 1. 下载音频
  // 2. 调用OpenAI Whisper API
  // 3. 解析响应（包含时间戳）
  // 4. 转换为SubtitleSegment格式
}
```

**缓存策略**:
- 使用**IndexedDB**存储识别结果（localStorage空间不足）
- Key: `speech-result:{videoId}`
- TTL: 30天（自动清理）
- 存储压缩后的JSON

**性能指标**:
- 识别延迟: ~0.5x实时（5分钟视频约2.5分钟）
- 音频提取: ~30秒
- 总体用户等待时间: ~3-4分钟 for 5分钟视频
- 进度反馈: 显示"提取音频中...""识别中..."进度条

---

## 8. Audio Processing Strategy

### Decision

使用**服务端音频处理**（Next.js API路由 + ffmpeg），避免客户端复杂度。

### Rationale

- **性能**: 服务端处理更快，不占用用户资源
- **兼容性**: 避免浏览器兼容性问题
- **功能完整**: ffmpeg支持所有音频格式转换
- **用户体验**: 后台处理，用户可继续浏览
- **错误处理**: 服务端更容易处理复杂错误

### Implementation Approach

```typescript
// app/api/bilibili/extract-audio/route.ts
import { exec } from 'child_process'
import { promisify } from 'util'

export async function POST(request: Request) {
  const { videoUrl } = await request.json()
  
  // 1. 使用you-get/yt-dlp提取音频
  // 2. 转换为MP3格式（ffmpeg）
  // 3. 返回音频文件URL或Base64
}
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| ffmpeg.wasm | 客户端处理，无需服务器 | 慢（10x slower），浏览器内存限制，复杂视频可能失败 | 性能和可靠性问题 |
| 直接使用Bilibili音频流 | 简单，无需转换 | 可能有CORS问题，格式可能不兼容Whisper | 需要验证可行性，作为备选 |
| 云函数处理 | 按需付费，可扩展 | 需要额外基础设施，冷启动延迟 | 项目简单，无需复杂架构 |

---

## 9. Subtitle Caching Strategy

### Decision

使用**IndexedDB**存储语音识别生成的字幕，**localStorage**存储用户高亮。

### Rationale

- **容量**: IndexedDB可存储数百MB，localStorage仅5-10MB
- **结构化数据**: IndexedDB支持索引和查询
- **大文件支持**: 长视频的字幕数据可能较大
- **性能**: IndexedDB异步操作，不阻塞UI
- **localStorage保留**: 用于轻量级用户数据（高亮）

### Implementation Approach

```typescript
// services/indexedDBStorage.ts
class SubtitleCache {
  private db: IDBDatabase
  
  async saveSubtitles(videoId: string, subtitles: SubtitleSegment[]): Promise<void>
  async loadSubtitles(videoId: string): Promise<SubtitleSegment[] | null>
  async clearOldCache(daysOld: number): Promise<void>
}
```

### Storage Schema

**IndexedDB: `bilibili-text-db`**
- Store: `subtitles`
  - Key: videoId (string)
  - Value: { subtitles: SubtitleSegment[], source: 'native' | 'speech', createdAt: Date }
- Store: `audio-cache` (可选，缓存音频文件)
  - Key: videoId
  - Value: { audioBlob: Blob, createdAt: Date }

**localStorage** (保持现有设计):
- Key: `highlights:{videoId}`
- Value: UserHighlight[]

---

## 10. Speech Recognition API Integration

### Decision

使用**OpenAI Whisper API** with `timestamp_granularities=["segment"]` 选项获取段落级时间戳。

### API Details

**Endpoint**: `https://api.openai.com/v1/audio/transcriptions`

**Parameters**:
```typescript
{
  file: File | Blob,
  model: "whisper-1",
  language: "zh", // 指定中文提升准确率
  response_format: "verbose_json", // 包含时间戳
  timestamp_granularities: ["segment"] // 段落级时间戳
}
```

**Response Format**:
```json
{
  "task": "transcribe",
  "language": "zh",
  "duration": 300.0,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": "欢迎来到bilibili",
      "tokens": [...],
      "temperature": 0.0
    }
  ]
}
```

### Rate Limits & Constraints

- **File Size**: 最大25MB
- **Duration**: 推荐<2小时
- **Rate Limit**: 50 requests/minute (足够使用)
- **Cost**: $0.006/minute ($1.80 for 5小时视频)
- **并发**: 单用户顺序处理即可

### Error Handling

```typescript
// 错误类型
type SpeechError = 
  | 'AUDIO_EXTRACTION_FAILED'
  | 'API_QUOTA_EXCEEDED' 
  | 'AUDIO_TOO_LARGE'
  | 'API_ERROR'
  | 'NETWORK_ERROR'

// 降级策略
// 1. API失败 → 提示用户，保存视频ID供稍后重试
// 2. 音频过大 → 分段处理或提示用户视频过长
// 3. 网络错误 → 自动重试3次，指数退避
```

---

## 11. User Flow for Videos Without Subtitles

### Decision

**自动降级策略**：优先使用原生字幕，如无字幕则自动触发语音识别。

### User Experience Flow

```
用户输入视频URL
  ↓
验证URL并加载视频信息
  ↓
尝试获取原生字幕
  ↓
[有字幕] → 直接使用，正常显示
  ↓
[无字幕] → 显示提示："该视频无字幕，正在生成中..."
  ↓
检查IndexedDB缓存
  ↓
[有缓存] → 加载缓存字幕，标记"由语音识别生成"
  ↓
[无缓存] → 开始语音识别流程
  ↓
显示进度: "提取音频中... (30s)" 
  ↓
显示进度: "识别字幕中... (60%)"
  ↓
完成: 显示字幕，保存到IndexedDB
  ↓
用户可正常使用（同步、高亮等功能）
```

### Progress Feedback

```typescript
interface SpeechRecognitionProgress {
  status: 'extracting' | 'transcribing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  estimatedTimeRemaining?: number // 秒
}
```

### UI Component

```typescript
// components/SpeechRecognitionStatus.tsx
<div className="speech-recognition-banner">
  <div className="status-icon">🎤</div>
  <div className="status-text">
    <p>该视频无原生字幕，正在使用AI生成字幕...</p>
    <ProgressBar value={progress} />
    <p className="text-sm text-gray-500">
      {status === 'extracting' && '提取音频中...'}
      {status === 'transcribing' && `识别中... ${progress}%`}
    </p>
  </div>
</div>
```

---

## Summary

All technical clarifications resolved:

1. **Subtitle Extraction**: Bilibili API + Next.js proxy route
2. **Contract Testing**: Jest with contract pattern + MSW
3. **State Management**: Zustand for global state
4. **Subtitle Parsing**: Native JSON parsing of Bilibili format
5. **Performance**: Virtualization + debouncing + memoization
6. **Accessibility**: WCAG 2.1 AA with keyboard navigation
7. **Speech Recognition**: OpenAI Whisper API with segment timestamps
8. **Audio Processing**: Server-side with ffmpeg/yt-dlp
9. **Subtitle Caching**: IndexedDB for generated subtitles
10. **API Integration**: OpenAI Whisper API with error handling
11. **User Flow**: Auto-fallback with progress feedback

Ready to proceed to Phase 1 (Design & Contracts).
