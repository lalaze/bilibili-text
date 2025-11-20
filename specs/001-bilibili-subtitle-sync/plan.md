# Implementation Plan: Bilibili Video Speech Recognition Subtitles

**Branch**: `001-bilibili-subtitle-sync` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bilibili-subtitle-sync/spec.md` + 语音识别字幕需求

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

为B站视频提供字幕支持的完整解决方案。当视频已有字幕时，使用现有字幕；当视频没有字幕时，通过语音识别技术自动生成字幕。实现字幕与视频的实时同步显示、高亮显示当前播放位置，以及用户手动标记重要字幕段落的功能。

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.3.0, Next.js 14.2.0  
**Primary Dependencies**: 
- 前端框架: Next.js (App Router), React, Zustand (状态管理)
- UI: Tailwind CSS, react-window (虚拟化列表)
- 语音识别: NEEDS CLARIFICATION (Web Speech API vs 云服务)
- 音频处理: NEEDS CLARIFICATION (ffmpeg.wasm vs 服务端处理)
- 测试: Jest, Testing Library, Playwright, MSW

**Storage**: 
- 本地存储: localStorage (用户高亮标记)
- 字幕缓存: NEEDS CLARIFICATION (IndexedDB vs localStorage)
- 语音识别结果缓存: NEEDS CLARIFICATION

**Testing**: Jest (单元测试 + 契约测试), Playwright (E2E测试), Testing Library (组件测试)  
**Target Platform**: Web浏览器 (桌面优先，Chrome/Firefox/Safari 最新版本)  
**Project Type**: Web应用 (Next.js单体应用)  

**Performance Goals**: 
- 视频加载: <2秒
- 字幕同步延迟: <500ms
- 用户交互响应: <100ms
- 语音识别延迟: NEEDS CLARIFICATION (目标 <10秒 for 5分钟视频)
- 支持1000+字幕段落无性能下降

**Constraints**: 
- 浏览器兼容性: 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
- 语音识别API限制: NEEDS CLARIFICATION (调用频率、文件大小、时长限制)
- 存储限制: localStorage (<5MB), IndexedDB (视浏览器而定)
- CORS限制: 需要Next.js API代理
- 无需用户认证或后端数据库

**Scale/Scope**: 
- 单用户应用
- 支持标准长度视频（<2小时）
- 每个视频最多1000个字幕段落
- 本地存储多个视频的高亮标记

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md`:

- [x] **Code Quality**: 采用Next.js App Router架构，明确分层（components/services/hooks/stores），遵循单一职责原则，使用TypeScript保证类型安全
- [x] **Testing Standards**: TDD方法已规划，包含契约测试（localStorage、API边界）、集成测试（Playwright）、单元测试（Jest+RTL），目标覆盖率>80%
- [x] **User Experience**: 
  - 一致的UI模式（Tailwind CSS）
  - 明确的错误处理（无字幕→自动语音识别，识别失败→友好提示）
  - 加载状态和反馈（视频加载、识别进度）
  - WCAG 2.1 AA无障碍标准（键盘导航、ARIA标签）
- [x] **Performance**: 
  - 性能目标已定义（<2s加载，<500ms同步，<100ms交互）
  - 可扩展性设计（虚拟化列表、debouncing、memoization）
  - 性能监控策略（浏览器Performance API、Web Vitals）
- [x] **Security**: 
  - 输入验证（URL格式、视频ID验证）
  - 使用Next.js API路由作为代理避免CORS和隐藏API密钥
  - 客户端数据存储安全（localStorage仅存非敏感数据）
  - 无服务端数据库，降低安全风险
- [x] **Documentation**: 
  - API文档（contracts/目录）
  - 架构决策（research.md中记录）
  - 用户指南（quickstart.md）
  - 代码内联文档（TSDoc注释）

**Complexity Justifications** (if any constitutional deviations required):

| Principle Deviation | Justification | Mitigation Strategy |
|---------------------|---------------|---------------------|
| 无偏离 | N/A | N/A |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                        # Next.js App Router页面
├── api/                    # API路由（代理Bilibili API、语音识别服务）
│   └── bilibili/
│       ├── subtitles/      # 获取现有字幕
│       ├── validate-url/   # 验证视频URL
│       ├── video/          # 获取视频信息
│       └── speech/         # 新增：语音识别服务
├── page.tsx                # 首页（输入视频URL）
├── layout.tsx              # 全局布局
├── globals.css             # 全局样式
└── video/
    └── [videoId]/
        └── page.tsx        # 视频播放页面

components/                 # React组件
├── VideoUrlInput.tsx       # 视频URL输入组件
├── VideoPlayer.tsx         # 视频播放器组件
├── SubtitleDisplay.tsx     # 字幕显示组件（虚拟化列表）
├── SubtitleSegment.tsx     # 单个字幕段落组件
├── ErrorMessage.tsx        # 错误消息组件
└── SpeechRecognitionStatus.tsx  # 新增：语音识别状态组件

hooks/                      # 自定义Hooks
├── useVideoPlayer.ts       # 视频播放器状态管理
├── useSubtitleSync.ts      # 字幕同步逻辑
├── useSubtitles.ts         # 字幕数据管理
├── useHighlights.ts        # 用户高亮管理
└── useSpeechRecognition.ts # 新增：语音识别Hook

services/                   # 业务逻辑服务
├── bilibili.ts             # Bilibili API交互
├── subtitleParser.ts       # 字幕解析器
├── storage.ts              # localStorage管理
└── speechRecognition.ts    # 新增：语音识别服务

stores/                     # Zustand全局状态
└── videoStore.ts           # 视频、字幕、播放状态

types/                      # TypeScript类型定义
├── video.ts                # Video接口
├── subtitle.ts             # SubtitleSegment接口
├── highlight.ts            # UserHighlight接口
├── playback.ts             # PlaybackState接口
└── errors.ts               # 错误类型定义

lib/                        # 工具函数
└── utils.ts                # 通用工具

__tests__/                  # 测试文件
├── components/             # 组件测试
├── hooks/                  # Hook测试
├── services/               # 服务测试（包含契约测试）
└── e2e/                    # 端到端测试

public/                     # 静态资源
└── [assets]

specs/                      # 功能规格文档
└── 001-bilibili-subtitle-sync/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md
    ├── tasks.md
    └── contracts/
```

**Structure Decision**: 

采用Next.js App Router单体应用架构。选择此结构的原因：

1. **单体应用简化**: 功能范围明确，无需前后端分离，使用Next.js API路由处理服务端逻辑
2. **清晰分层**: components（UI）、hooks（UI逻辑）、services（业务逻辑）、stores（状态）分离
3. **类型安全**: 统一的types目录，所有模块共享类型定义
4. **测试友好**: 测试目录结构镜像源代码结构，便于查找和维护
5. **扩展性**: 如需添加后端服务（如语音识别），可在app/api中添加路由

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违规记录。所有设计决策均符合项目宪法要求。

---

## Phase 0 Completion

✅ **Research Phase 完成**
- 所有 NEEDS CLARIFICATION 项已解决
- 技术选型已确定（OpenAI Whisper API, IndexedDB, 服务端音频处理）
- 降级策略已定义（原生字幕优先，无字幕时自动语音识别）
- 性能目标已明确
- 用户体验流程已设计

详见: [research.md](./research.md)

---

## Phase 1 Completion

✅ **Design & Contracts Phase 完成**
- 数据模型已更新（添加 SpeechRecognitionTask, SubtitleCache 实体）
- API 契约已定义（3个新增 API 路由）
- 服务契约已定义（IndexedDBService, SpeechRecognitionService）
- 错误处理策略已完善
- 缓存策略已设计（IndexedDB 30天 TTL）
- Agent context 已更新

详见: 
- [data-model.md](./data-model.md)
- [contracts/api-routes.md](./contracts/api-routes.md)
- [quickstart.md](./quickstart.md)

---

## Next Steps

Phase 2 将由 `/speckit.tasks` 命令生成具体实现任务。

**准备工作**:
1. ✅ 技术研究完成
2. ✅ 数据模型设计完成
3. ✅ API 契约定义完成
4. ✅ 用户流程设计完成
5. 🔄 等待任务分解和实现

**关键技术依赖**:
- OpenAI API Key（需要在部署前获取）
- Bilibili 音频提取方案（需要验证可行性）
- IndexedDB 支持（现代浏览器均支持）

**风险提示**:
- OpenAI API 成本（按使用量计费，需要监控）
- 音频提取可能受 Bilibili 限制（需要测试多种视频类型）
- 长视频处理时间较长（用户体验需要良好的进度反馈）
