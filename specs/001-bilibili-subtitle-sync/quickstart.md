# Quickstart Guide: Bilibili Video Subtitle Synchronization

**Feature**: 001-bilibili-subtitle-sync
**Date**: 2025-11-19

## Overview

This guide walks through setting up, developing, and testing the Bilibili subtitle synchronization application using Next.js 14 with TypeScript.

---

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)

---

## Initial Setup

### 1. Initialize Next.js Project

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest bilibili-text --typescript --tailwind --app --no-src-dir

cd bilibili-text

# Install additional dependencies
npm install zustand
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
npm install -D @playwright/test
npm install -D eslint-config-prettier prettier
npm install react-window @types/react-window
npm install openai  # For Whisper API integration
npm install idb      # For IndexedDB wrapper (optional, can use native API)
```

### 1.1 Environment Variables

创建 `.env.local` 文件：

```bash
# OpenAI API Key for Whisper
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_VIDEO_DURATION=7200  # 2 hours in seconds
MAX_AUDIO_SIZE=26214400  # 25MB in bytes
```

**重要**: 将 `.env.local` 添加到 `.gitignore`
```

### 2. Project Structure Setup

```bash
# Create directory structure
mkdir -p components hooks services stores types lib __tests__/{components,hooks,services,e2e}
mkdir -p app/api/bilibili/{video,subtitles,validate-url,speech}
mkdir -p app/api/bilibili/speech
mkdir -p app/video/[videoId]
mkdir -p specs/001-bilibili-subtitle-sync/contracts
```

### 3. Configuration Files

**tsconfig.json** (update paths):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/hooks/*": ["hooks/*"],
      "@/services/*": ["services/*"],
      "@/types/*": ["types/*"],
      "@/lib/*": ["lib/*"]
    }
  }
}
```

**jest.config.js**:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

**.prettierrc**:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## Development Workflow

### Phase 1: Core Types (TDD Start)

**Step 1**: Create type definitions

```bash
# types/video.ts
export interface Video {
  id: string
  url: string
  title?: string
  duration?: number
  cid?: string
  embedUrl: string
  loadedAt: Date
}

# types/subtitle.ts
export interface SubtitleSegment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  text: string
  index: number
  language?: string
  source: 'native' | 'speech'  # NEW: 区分字幕来源
  confidence?: number          # NEW: 语音识别置信度 (0-1)
}

# types/highlight.ts
export interface UserHighlight {
  id: string
  videoId: string
  segmentId: string
  createdAt: Date
  color?: string
}

# types/speechRecognition.ts (NEW)
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

### Phase 2: Storage Service (TDD)

**Step 1**: Write failing test

```typescript
// __tests__/services/storage.test.ts
import { StorageService } from '@/services/storage'

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads highlights', () => {
    const service = new StorageService()
    const highlights = [
      {
        id: '1',
        videoId: 'BV123',
        segmentId: 'sub-1',
        createdAt: new Date(),
      },
    ]

    service.saveHighlights('BV123', highlights)
    const loaded = service.loadHighlights('BV123')

    expect(loaded).toEqual(highlights)
  })
})
```

**Step 2**: Run test (should fail)

```bash
npm test -- storage.test.ts
```

**Step 3**: Implement service

```typescript
// services/storage.ts
export class StorageService {
  private getKey(videoId: string): string {
    return `highlights:${videoId}`
  }

  saveHighlights(videoId: string, highlights: UserHighlight[]): void {
    const key = this.getKey(videoId)
    localStorage.setItem(key, JSON.stringify(highlights))
  }

  loadHighlights(videoId: string): UserHighlight[] {
    const key = this.getKey(videoId)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  clearHighlights(videoId: string): void {
    const key = this.getKey(videoId)
    localStorage.removeItem(key)
  }
}
```

**Step 4**: Run test (should pass)

```bash
npm test -- storage.test.ts
```

### Phase 3: Bilibili Service (TDD)

**Step 1**: Write failing test with MSW

```typescript
// __tests__/services/bilibili.test.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { BilibiliService } from '@/services/bilibili'

const server = setupServer(
  rest.get('/api/bilibili/video', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'BV123',
        title: 'Test Video',
        duration: 600,
        cid: '123456',
        embedUrl: 'https://...',
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('BilibiliService', () => {
  it('fetches video metadata', async () => {
    const service = new BilibiliService()
    const video = await service.fetchVideoMetadata('BV123')

    expect(video.id).toBe('BV123')
    expect(video.title).toBe('Test Video')
  })
})
```

**Step 2**: Implement service

```typescript
// services/bilibili.ts
export class BilibiliService {
  async fetchVideoMetadata(videoId: string): Promise<Video> {
    const response = await fetch(`/api/bilibili/video?videoId=${videoId}`)
    if (!response.ok) throw new Error('Failed to fetch video')
    return response.json()
  }

  async fetchSubtitles(videoId: string, cid: string): Promise<SubtitleData> {
    const response = await fetch(
      `/api/bilibili/subtitles?videoId=${videoId}&cid=${cid}`
    )
    if (!response.ok) throw new Error('Failed to fetch subtitles')
    return response.json()
  }
}
```

### Phase 4: API Routes

**Step 1**: Implement video metadata route

```typescript
// app/api/bilibili/video/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json(
      { error: { code: 'INVALID_PARAMS', message: 'Missing videoId' } },
      { status: 400 }
    )
  }

  try {
    // Fetch from Bilibili API
    const response = await fetch(
      `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
    )
    const data = await response.json()

    if (data.code !== 0) {
      return NextResponse.json(
        { error: { code: 'VIDEO_NOT_FOUND', message: 'Video not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: videoId,
      title: data.data.title,
      duration: data.data.duration,
      cid: data.data.cid.toString(),
      embedUrl: `https://player.bilibili.com/player.html?bvid=${videoId}&cid=${data.data.cid}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch video' } },
      { status: 500 }
    )
  }
}
```

### Phase 5: Components (TDD)

**Step 1**: Write component test

```typescript
// __tests__/components/SubtitleSegment.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import SubtitleSegment from '@/components/SubtitleSegment'

describe('SubtitleSegment', () => {
  const mockSegment = {
    id: 'sub-1',
    videoId: 'BV123',
    startTime: 0,
    endTime: 2.5,
    text: 'Hello world',
    index: 0,
  }

  it('renders segment text', () => {
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={jest.fn()}
      />
    )

    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('calls onClick with segment ID', () => {
    const handleClick = jest.fn()
    render(
      <SubtitleSegment
        segment={mockSegment}
        isActive={false}
        isHighlighted={false}
        onClick={handleClick}
      />
    )

    fireEvent.click(screen.getByText('Hello world'))
    expect(handleClick).toHaveBeenCalledWith('sub-1')
  })
})
```

**Step 2**: Implement component

```typescript
// components/SubtitleSegment.tsx
import React from 'react'
import { SubtitleSegment as SubtitleSegmentType } from '@/types/subtitle'

interface Props {
  segment: SubtitleSegmentType
  isActive: boolean
  isHighlighted: boolean
  onClick: (segmentId: string) => void
}

const SubtitleSegment = React.memo<Props>(
  ({ segment, isActive, isHighlighted, onClick }) => {
    return (
      <div
        className={`
          p-4 cursor-pointer transition-colors
          ${isActive ? 'bg-yellow-200' : ''}
          ${isHighlighted ? 'border-l-4 border-blue-500' : ''}
          hover:bg-gray-100
        `}
        onClick={() => onClick(segment.id)}
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
      >
        <p className="text-sm text-gray-600">
          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
        </p>
        <p className="text-base">{segment.text}</p>
      </div>
    )
  }
)

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default SubtitleSegment
```

### Phase 6: Speech Recognition Service (NEW)

**Step 1**: 实现 IndexedDB 存储服务

```typescript
// services/indexedDBStorage.ts
const DB_NAME = 'bilibili-text-db'
const DB_VERSION = 1
const SUBTITLE_STORE = 'subtitle-cache'

export class IndexedDBService {
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(SUBTITLE_STORE)) {
          const store = db.createObjectStore(SUBTITLE_STORE, { keyPath: 'videoId' })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('source', 'source', { unique: false })
        }
      }
    })
  }

  async saveSubtitleCache(cache: SubtitleCache): Promise<void> {
    if (!this.db) await this.initialize()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SUBTITLE_STORE], 'readwrite')
      const store = transaction.objectStore(SUBTITLE_STORE)
      const request = store.put(cache)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadSubtitleCache(videoId: string): Promise<SubtitleCache | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SUBTITLE_STORE], 'readonly')
      const store = transaction.objectStore(SUBTITLE_STORE)
      const request = store.get(videoId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const cache = request.result
        if (cache && new Date(cache.expiresAt) > new Date()) {
          resolve(cache)
        } else {
          resolve(null)
        }
      }
    })
  }
}
```

**Step 2**: 实现语音识别 API 路由

```typescript
// app/api/bilibili/speech/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const { videoId, cid, language = 'zh' } = await request.json()

  try {
    // 1. 提取音频 (使用 Bilibili API 或 yt-dlp)
    const audioUrl = await extractAudioUrl(videoId, cid)
    
    // 2. 下载音频文件
    const audioBlob = await downloadAudio(audioUrl)
    
    // 3. 检查大小限制
    if (audioBlob.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'AUDIO_TOO_LARGE', message: 'Audio exceeds 25MB limit' } },
        { status: 413 }
      )
    }

    // 4. 调用 Whisper API
    const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' })
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    // 5. 转换为 SubtitleSegment 格式
    const subtitles = transcription.segments.map((segment, index) => ({
      id: `subtitle-${index}`,
      videoId: videoId,
      startTime: segment.start,
      endTime: segment.end,
      text: segment.text.trim(),
      index: index,
      source: 'speech',
      confidence: segment.no_speech_prob ? 1 - segment.no_speech_prob : undefined,
    }))

    return NextResponse.json({
      taskId: null,
      videoId: videoId,
      status: 'completed',
      progress: 100,
      subtitles: subtitles,
    })

  } catch (error) {
    console.error('Speech recognition error:', error)
    return NextResponse.json(
      { error: { code: 'API_ERROR', message: 'Speech recognition failed' } },
      { status: 500 }
    )
  }
}

async function extractAudioUrl(videoId: string, cid: string): Promise<string> {
  // 实现音频 URL 提取逻辑
  // 选项 1: 使用 Bilibili play URL API
  // 选项 2: 使用 yt-dlp 命令行工具
  const response = await fetch(
    `https://api.bilibili.com/x/player/playurl?bvid=${videoId}&cid=${cid}&qn=64&fnval=16`
  )
  const data = await response.json()
  return data.data.durl[0].url
}

async function downloadAudio(url: string): Promise<Blob> {
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://www.bilibili.com',
      'User-Agent': 'Mozilla/5.0 ...',
    },
  })
  return response.blob()
}
```

**Step 3**: 实现前端服务

```typescript
// services/speechRecognition.ts
export class SpeechRecognitionService {
  private indexedDB: IndexedDBService

  constructor() {
    this.indexedDB = new IndexedDBService()
  }

  async transcribeVideo(
    videoId: string,
    cid: string,
    language: string = 'zh'
  ): Promise<{ taskId: string | null; status: string; subtitles?: SubtitleSegment[] }> {
    // 1. 检查缓存
    await this.indexedDB.initialize()
    const cached = await this.indexedDB.loadSubtitleCache(videoId)
    
    if (cached) {
      return {
        taskId: null,
        status: 'completed',
        subtitles: cached.subtitles,
      }
    }

    // 2. 调用 API
    const response = await fetch('/api/bilibili/speech/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, cid, language }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    const result = await response.json()

    // 3. 保存到缓存
    if (result.status === 'completed' && result.subtitles) {
      const cache: SubtitleCache = {
        videoId: videoId,
        subtitles: result.subtitles,
        source: 'speech',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
      }
      await this.indexedDB.saveSubtitleCache(cache)
    }

    return result
  }
}
```

**Step 4**: 实现进度显示组件

```typescript
// components/SpeechRecognitionStatus.tsx
import React from 'react'

interface Props {
  status: 'extracting' | 'transcribing' | 'completed' | 'error'
  progress: number
  errorMessage?: string
}

export default function SpeechRecognitionStatus({ status, progress, errorMessage }: Props) {
  if (status === 'completed') return null

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {status === 'error' ? (
            <span className="text-2xl">❌</span>
          ) : (
            <span className="text-2xl">🎤</span>
          )}
        </div>
        <div className="ml-3 flex-1">
          {status === 'error' ? (
            <p className="text-sm text-red-800">{errorMessage}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-blue-800">
                该视频无原生字幕，正在使用AI生成字幕...
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {status === 'extracting' && '正在提取音频...'}
                {status === 'transcribing' && `识别中... ${progress}%`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Running the Application

### Development Server

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

---

## User Flow Testing

### Manual Test Checklist

1. **Video Loading**:
   - [ ] Enter valid Bilibili URL
   - [ ] Video embeds successfully
   - [ ] Subtitles load and display
   - [ ] Error shown for invalid URL

2. **Subtitle Sync**:
   - [ ] Play video
   - [ ] Current subtitle highlights in yellow
   - [ ] Highlight updates as video plays
   - [ ] Pause maintains highlight

3. **Manual Highlights**:
   - [ ] Click subtitle to highlight
   - [ ] Blue border appears
   - [ ] Click again to remove
   - [ ] Multiple highlights work

4. **Persistence**:
   - [ ] Highlight subtitles
   - [ ] Refresh page
   - [ ] Highlights restored

5. **Speech Recognition** (NEW):
   - [ ] Video without native subtitles triggers speech recognition
   - [ ] Progress indicator shows extraction and transcription status
   - [ ] Generated subtitles display correctly
   - [ ] Cached subtitles load instantly on second visit
   - [ ] Generated subtitles marked with "AI生成" badge
   - [ ] Confidence scores displayed (if low confidence)

6. **Edge Cases**:
   - [ ] Video with no subtitles → triggers speech recognition
   - [ ] Very long video (1000+ segments)
   - [ ] Invalid video ID
   - [ ] Network error handling
   - [ ] Speech recognition failure → shows error message
   - [ ] Audio too large (>25MB) → shows appropriate error
   - [ ] IndexedDB quota exceeded → cleanup old cache

---

## Debugging Tips

### Common Issues

**Issue**: CORS errors when fetching from Bilibili
**Solution**: Use Next.js API routes as proxy

**Issue**: Subtitle sync lag
**Solution**: Check debounce timing, reduce to 50ms if needed

**Issue**: localStorage quota exceeded
**Solution**: Implement cleanup for old highlights

**Issue**: Video not embedding
**Solution**: Check Bilibili embed restrictions, try different video

**Issue**: Speech recognition fails
**Solution**: Check OpenAI API key, verify audio extraction, check API quota

**Issue**: Speech recognition too slow
**Solution**: Consider splitting long videos, optimize audio format, check network speed

**Issue**: IndexedDB errors
**Solution**: Check browser support, clear browser data, check quota limits

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('DEBUG', 'bilibili:*')

// Check Zustand state
import { useStore } from '@/stores/videoStore'
console.log(useStore.getState())

// Monitor performance
React.useEffect(() => {
  console.time('subtitle-render')
  return () => console.timeEnd('subtitle-render')
})
```

---

## Performance Validation

### Lighthouse Checks

```bash
# Run Lighthouse
npm run build
npm start
# Open Chrome DevTools > Lighthouse > Run
```

**Target Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

### Performance Budgets

```javascript
// Check bundle size
npm run build
# Check .next/static output

// Target: <500KB total JS
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables

在 Vercel 项目设置中添加：

```bash
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
MAX_VIDEO_DURATION=7200
MAX_AUDIO_SIZE=26214400
```

**安全提示**: 
- 永远不要提交 `.env.local` 到 git
- 使用 Vercel 环境变量管理敏感信息
- 定期轮换 API keys

---

## Next Steps

After completing this quickstart:

1. Run `/speckit.tasks` to generate implementation tasks
2. Follow TDD workflow for each task
3. Commit after each passing test
4. Deploy to staging for testing
5. Gather user feedback
6. Iterate on features

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev)
- [Bilibili API (unofficial)](https://github.com/SocialSisterYi/bilibili-API-collect)

---

## Support

For issues or questions:
1. Check [spec.md](spec.md) for requirements
2. Review [contracts/](contracts/) for API details
3. Check [research.md](research.md) for technical decisions
4. Open issue in project repository
