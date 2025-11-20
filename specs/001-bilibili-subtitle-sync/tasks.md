# Tasks: Bilibili Video Subtitle Synchronization with Speech Recognition

**Feature Branch**: `001-bilibili-subtitle-sync`
**Input**: Design documents from `/Volumes/data/code/bilibili-text/specs/001-bilibili-subtitle-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router: `app/`, `components/`, `hooks/`, `services/`, `stores/`, `types/`
- Tests: `__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Install required dependencies: zustand, react-window, openai, idb per quickstart.md
- [ ] T002 [P] Configure environment variables in .env.local (OPENAI_API_KEY, MAX_VIDEO_DURATION, MAX_AUDIO_SIZE)
- [ ] T003 [P] Configure Jest with jest.config.js and jest.setup.js for testing
- [ ] T004 [P] Configure Playwright for E2E tests in playwright.config.ts
- [ ] T005 [P] Configure TypeScript paths in tsconfig.json (@/components, @/hooks, @/services, @/types)
- [ ] T006 [P] Configure Prettier and ESLint with .prettierrc and eslint-config-prettier
- [ ] T007 [P] Setup Tailwind CSS configuration in tailwind.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [ ] T008 [P] Create Video interface in types/video.ts with id, url, title, duration, cid, embedUrl, loadedAt
- [ ] T009 [P] Create SubtitleSegment interface in types/subtitle.ts with id, videoId, startTime, endTime, text, index, language, source, confidence
- [ ] T010 [P] Create UserHighlight interface in types/highlight.ts with id, videoId, segmentId, createdAt, color
- [ ] T011 [P] Create PlaybackState interface in types/playback.ts with videoId, currentTime, isPlaying, activeSegmentId, playbackRate, volume
- [ ] T012 [P] Create error types in types/errors.ts (VideoError, SubtitleError, SpeechRecognitionError, StorageError)
- [ ] T013 [P] Create SpeechRecognitionTask and SubtitleCache interfaces in types/speechRecognition.ts

### Core Services (TDD - Tests First)

- [ ] T014 [P] Write contract test for StorageService in __tests__/services/storage.contract.test.ts
- [ ] T015 Implement StorageService in services/storage.ts (saveHighlights, loadHighlights, clearHighlights, isAvailable)
- [ ] T016 [P] Write contract test for IndexedDBService in __tests__/services/indexedDBStorage.contract.test.ts
- [ ] T017 Implement IndexedDBService in services/indexedDBStorage.ts (initialize, saveSubtitleCache, loadSubtitleCache, clearExpiredCache)

### Zustand Store

- [ ] T018 Create videoStore in stores/videoStore.ts with state (videoId, currentTime, isPlaying, subtitles, highlights, activeSegmentId, error) and actions (setVideoId, updateTime, setPlaying, loadSubtitles, toggleHighlight, setActiveSegment, setError, reset)

### Utility Functions

- [ ] T019 [P] Create utility functions in lib/utils.ts (formatTime, validateBilibiliUrl, extractVideoId)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Video Playback with Subtitle Display (Priority: P1) 🎯 MVP

**Goal**: Users can enter a Bilibili video URL, see the embedded video player, and view subtitles below the video (native subtitles or AI-generated via speech recognition)

**Independent Test**: Enter a valid Bilibili video URL → Video loads and plays → Subtitles display below video (either native or AI-generated with progress indicator)

### Tests for User Story 1 (TDD - Write Tests First)

- [ ] T020 [P] [US1] Write test for VideoUrlInput component in __tests__/components/VideoUrlInput.test.tsx (validation, submission, error display)
- [ ] T021 [P] [US1] Write test for ErrorMessage component in __tests__/components/ErrorMessage.test.tsx (display, dismiss, ARIA roles)
- [ ] T022 [P] [US1] Write contract test for BilibiliService in __tests__/services/bilibili.contract.test.ts (validateUrl, fetchVideoMetadata, fetchSubtitles with MSW)
- [ ] T023 [P] [US1] Write contract test for SpeechRecognitionService in __tests__/services/speechRecognition.contract.test.ts (transcribeVideo, hasCachedResult)

### API Routes Implementation

- [ ] T024 [P] [US1] Implement POST /api/bilibili/validate-url route in app/api/bilibili/validate-url/route.ts (validate URL format, extract video ID)
- [ ] T025 [P] [US1] Implement GET /api/bilibili/video route in app/api/bilibili/video/route.ts (fetch video metadata from Bilibili API)
- [ ] T026 [US1] Implement GET /api/bilibili/subtitles route in app/api/bilibili/subtitles/route.ts (fetch native subtitles, handle NO_SUBTITLES case)
- [ ] T027 [US1] Implement POST /api/bilibili/speech/transcribe route in app/api/bilibili/speech/route.ts (extract audio, call Whisper API, parse results)
- [ ] T028 [P] [US1] Implement GET /api/bilibili/speech/cache route in app/api/bilibili/speech/cache/route.ts (check if cached subtitles exist)

### Services Implementation

- [ ] T029 [US1] Implement BilibiliService in services/bilibili.ts (validateUrl, fetchVideoMetadata, fetchSubtitles methods)
- [ ] T030 [US1] Implement subtitleParser in services/subtitleParser.ts (parse Bilibili subtitle format and Whisper response to SubtitleSegment[])
- [ ] T031 [US1] Implement SpeechRecognitionService in services/speechRecognition.ts (transcribeVideo, hasCachedResult, with IndexedDB caching)

### Components Implementation

- [ ] T032 [P] [US1] Implement ErrorMessage component in components/ErrorMessage.tsx (display errors with icons, dismiss button, ARIA role="alert")
- [ ] T033 [P] [US1] Implement VideoUrlInput component in components/VideoUrlInput.tsx (form, validation, loading state, error display)
- [ ] T034 [US1] Implement VideoPlayer component in components/VideoPlayer.tsx (iframe embed, event handlers for timeUpdate and playStateChange)
- [ ] T035 [P] [US1] Implement SpeechRecognitionStatus component in components/SpeechRecognitionStatus.tsx (progress bar, status messages)
- [ ] T036 [P] [US1] Implement SubtitleSegment component in components/SubtitleSegment.tsx (display text, timing, basic styling, memoized)
- [ ] T037 [US1] Implement SubtitleDisplay component in components/SubtitleDisplay.tsx (virtualized list with react-window, render all segments)

### Custom Hooks

- [ ] T038 [P] [US1] Implement useSubtitles hook in hooks/useSubtitles.ts (fetch native subtitles, fallback to speech recognition, handle loading and errors)
- [ ] T039 [P] [US1] Implement useVideoPlayer hook in hooks/useVideoPlayer.ts (manage playback state, sync with store)

### Pages

- [ ] T040 [US1] Implement home page in app/page.tsx (render VideoUrlInput, handle URL submission, navigate to video page)
- [ ] T041 [US1] Implement video page in app/video/[videoId]/page.tsx (load video metadata, load subtitles with speech recognition fallback, render VideoPlayer and SubtitleDisplay)

### Integration & Error Handling

- [ ] T042 [US1] Add error boundaries and error handling for video loading failures (VIDEO_NOT_FOUND, VIDEO_RESTRICTED, EMBED_BLOCKED)
- [ ] T043 [US1] Add error handling for subtitle fetch failures (NO_SUBTITLES triggers speech recognition, SUBTITLE_FETCH_FAILED shows retry)
- [ ] T044 [US1] Add error handling for speech recognition failures (AUDIO_EXTRACTION_FAILED, AUDIO_TOO_LARGE, API_ERROR with user-friendly messages)

### E2E Tests

- [ ] T045 [US1] Write E2E test for video loading flow in __tests__/e2e/video-loading.spec.ts (enter URL, video loads, subtitles display)

**Checkpoint**: User Story 1 完成 - 用户可以加载视频并查看字幕（原生或AI生成）

---

## Phase 4: User Story 2 - Automatic Subtitle Highlighting During Playback (Priority: P2)

**Goal**: As video plays, current subtitle segment automatically highlights, making it easy to track which text corresponds to what's being said

**Independent Test**: Load a video with subtitles → Play video → Observe subtitle highlighting syncs with playback → Pause/seek and verify highlight updates correctly

### Tests for User Story 2 (TDD - Write Tests First)

- [ ] T046 [P] [US2] Write test for SubtitleDisplay component in __tests__/components/SubtitleDisplay.test.tsx (active segment highlighting, scroll behavior)
- [ ] T047 [P] [US2] Write test for useSubtitleSync hook in __tests__/hooks/useSubtitleSync.test.ts (compute active segment, debouncing, time updates)
- [ ] T048 [P] [US2] Write test for SubtitleSegment component in __tests__/components/SubtitleSegment.test.tsx (active styling, ARIA attributes)

### Implementation

- [ ] T049 [P] [US2] Implement useSubtitleSync hook in hooks/useSubtitleSync.ts (compute active segment from currentTime, debounce updates at 100ms, provide scrollToActive function)
- [ ] T050 [US2] Update SubtitleDisplay component to accept activeSegmentId prop and highlight active segment (yellow background)
- [ ] T051 [US2] Update SubtitleSegment component to apply active styling (yellow background, aria-current="true") when isActive=true
- [ ] T052 [US2] Update VideoPlayer component to fire onTimeUpdate callback every 250ms during playback
- [ ] T053 [US2] Integrate useSubtitleSync in video page app/video/[videoId]/page.tsx (pass currentTime, get activeSegmentId, pass to SubtitleDisplay)
- [ ] T054 [US2] Add auto-scroll to active segment functionality in SubtitleDisplay component

### Integration

- [ ] T055 [US2] Handle pause behavior: ensure active segment remains highlighted when video is paused
- [ ] T056 [US2] Handle seek behavior: update active segment when user seeks to different timestamp
- [ ] T057 [US2] Performance optimization: ensure highlighting doesn't cause lag with 1000+ segments

### E2E Tests

- [ ] T058 [US2] Write E2E test for subtitle sync in __tests__/e2e/subtitle-sync.spec.ts (play video, verify highlight moves, pause/seek tests)

**Checkpoint**: User Stories 1 AND 2 完成 - 视频播放时字幕自动高亮

---

## Phase 5: User Story 3 - Manual Subtitle Highlighting (Priority: P3)

**Goal**: Users can click subtitle segments to apply persistent highlights for marking important moments, with highlights saved and restored across sessions

**Independent Test**: Load video → Click subtitle segments → See persistent blue border → Reload page → Verify highlights are restored

### Tests for User Story 3 (TDD - Write Tests First)

- [ ] T059 [P] [US3] Write test for useHighlights hook in __tests__/hooks/useHighlights.test.ts (toggle highlight, persistence, localStorage interaction)
- [ ] T060 [P] [US3] Write test for SubtitleSegment click behavior in __tests__/components/SubtitleSegment.test.tsx (onClick callback, toggling)
- [ ] T061 [P] [US3] Write test for SubtitleDisplay with highlights in __tests__/components/SubtitleDisplay.test.tsx (multiple highlights, visual distinction)

### Implementation

- [ ] T062 [P] [US3] Implement useHighlights hook in hooks/useHighlights.ts (load from localStorage on mount, toggleHighlight, clearHighlights, persist changes)
- [ ] T063 [US3] Update SubtitleSegment component to handle isHighlighted prop (blue left border styling)
- [ ] T064 [US3] Update SubtitleSegment component to call onClick callback when clicked
- [ ] T065 [US3] Update SubtitleDisplay component to accept highlightedSegmentIds prop and onSegmentClick callback
- [ ] T066 [US3] Integrate useHighlights in video page app/video/[videoId]/page.tsx (load highlights, pass to SubtitleDisplay, handle toggle)
- [ ] T067 [US3] Update videoStore to include highlights state and toggleHighlight action
- [ ] T068 [US3] Ensure both active (yellow) and highlighted (blue border) styles can coexist visually

### Error Handling

- [ ] T069 [US3] Handle localStorage quota exceeded error gracefully (show warning, allow clearing old highlights)
- [ ] T070 [US3] Handle localStorage unavailable scenario (features work but no persistence)

### E2E Tests

- [ ] T071 [US3] Write E2E test for manual highlighting in __tests__/e2e/manual-highlighting.spec.ts (click to highlight, click to remove, persistence across reload)

**Checkpoint**: All user stories complete - Full MVP with video playback, auto-sync, and manual highlighting

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

### Performance Optimization

- [ ] T072 [P] Optimize SubtitleDisplay with react-window virtualization for 1000+ segments
- [ ] T073 [P] Add React.memo to SubtitleSegment component to prevent unnecessary re-renders
- [ ] T074 [P] Add useMemo for expensive computations in useSubtitleSync and useHighlights
- [ ] T075 [P] Implement debouncing for time updates in useVideoPlayer (100ms)

### Accessibility Improvements

- [ ] T076 [P] Add ARIA labels to all interactive components (VideoPlayer, SubtitleDisplay, VideoUrlInput)
- [ ] T077 [P] Implement keyboard navigation for subtitle segments (Tab, Enter, Space)
- [ ] T078 [P] Add skip-to-content link in app/layout.tsx
- [ ] T079 [P] Verify color contrast meets WCAG 2.1 AA standards (4.5:1 for text, 3:1 for UI)
- [ ] T080 [P] Add prefers-reduced-motion support for animations

### IndexedDB Cache Management

- [ ] T081 [P] Implement automatic cleanup of expired cache entries (>30 days) in IndexedDBService
- [ ] T082 [P] Add cache size monitoring and quota management
- [ ] T083 [P] Implement cache statistics display (optional settings page showing cached videos)

### Documentation

- [ ] T084 [P] Add inline TSDoc comments to all public APIs in services/ and hooks/
- [ ] T085 [P] Update README.md with setup instructions, environment variables, and usage examples
- [ ] T086 [P] Create CONTRIBUTING.md with development workflow and testing guidelines

### Code Quality

- [ ] T087 [P] Run linter and fix all warnings: npm run lint
- [ ] T088 [P] Verify test coverage meets 80% threshold: npm test -- --coverage
- [ ] T089 [P] Run all E2E tests: npm run test:e2e
- [ ] T090 [P] Verify quickstart.md manual test checklist

### Security Hardening

- [ ] T091 [P] Verify OPENAI_API_KEY is not exposed to client (server-side only)
- [ ] T092 [P] Add rate limiting considerations for API routes (document in comments)
- [ ] T093 [P] Validate and sanitize all user inputs (URL validation in VideoUrlInput)

### Deployment Preparation

- [ ] T094 Build production bundle: npm run build
- [ ] T095 Verify bundle size is acceptable (<500KB total JS)
- [ ] T096 Run Lighthouse audit (target: Performance 90+, Accessibility 95+, Best Practices 90+)
- [ ] T097 Configure Vercel environment variables (OPENAI_API_KEY)
- [ ] T098 Deploy to Vercel: vercel --prod

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Enhances US1 but independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - Enhances US1 but independently testable
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US1 components but independently testable

### Within Each User Story (TDD Workflow)

1. **Tests FIRST**: Write tests and verify they FAIL
2. **Models/Types**: Create data structures
3. **Services**: Implement business logic
4. **API Routes**: Create Next.js API endpoints
5. **Hooks**: Create custom React hooks
6. **Components**: Build UI components
7. **Pages**: Integrate everything
8. **E2E Tests**: Verify end-to-end flow
9. **Tests PASS**: Verify all tests pass

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T002-T007 can all run in parallel (different config files)

**Within Foundational (Phase 2)**:
- T008-T013 (all type definitions) can run in parallel
- T014 and T016 (test files) can run in parallel
- T019 can run in parallel with any other foundational task

**Within User Story 1 (Phase 3)**:
- T020-T023 (all tests) can run in parallel
- T024, T025, T028 (API routes with no dependencies) can run in parallel
- T032, T033, T035, T036 (independent components) can run in parallel after tests
- T038, T039 (hooks) can run in parallel after services

**Within User Story 2 (Phase 4)**:
- T046-T048 (all tests) can run in parallel
- T049, T051, T052 (independent updates) can run in parallel

**Within User Story 3 (Phase 5)**:
- T059-T061 (all tests) can run in parallel
- T062, T063, T064 (independent implementations) can run in parallel

**Within Polish (Phase 6)**:
- T072-T075 (performance) can run in parallel
- T076-T080 (accessibility) can run in parallel
- T081-T083 (cache management) can run in parallel
- T084-T086 (documentation) can run in parallel
- T087-T093 (quality & security) can run in parallel

**Across User Stories** (if multiple developers):
- After Foundational completes, US1, US2, and US3 can all start in parallel
- Each developer takes one user story
- Stories integrate at the end with minimal conflicts

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T020: "Write test for VideoUrlInput component"
Task T021: "Write test for ErrorMessage component"
Task T022: "Write contract test for BilibiliService"
Task T023: "Write contract test for SpeechRecognitionService"

# After tests written, launch independent API routes:
Task T024: "Implement POST /api/bilibili/validate-url"
Task T025: "Implement GET /api/bilibili/video"
Task T028: "Implement GET /api/bilibili/speech/cache"

# After services ready, launch independent components:
Task T032: "Implement ErrorMessage component"
Task T033: "Implement VideoUrlInput component"
Task T035: "Implement SpeechRecognitionStatus component"
Task T036: "Implement SubtitleSegment component"

# After components ready, launch hooks:
Task T038: "Implement useSubtitles hook"
Task T039: "Implement useVideoPlayer hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T019) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T020-T045)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Enter video URL with native subtitles → should work
   - Enter video URL without subtitles → should trigger speech recognition
   - Check IndexedDB for cached results
5. Deploy/demo if ready

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational → Foundation ready (T001-T019)
2. **MVP**: Add User Story 1 → Test independently → Deploy/Demo (T020-T045)
3. **Enhanced**: Add User Story 2 → Test independently → Deploy/Demo (T046-T058)
4. **Complete**: Add User Story 3 → Test independently → Deploy/Demo (T059-T071)
5. **Polish**: Add Phase 6 improvements → Final deployment (T072-T098)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With 3 developers:

1. **All together**: Complete Setup + Foundational (T001-T019)
2. **Split up** once Foundational is done:
   - Developer A: User Story 1 (T020-T045)
   - Developer B: User Story 2 (T046-T058) - starts after US1 components exist
   - Developer C: User Story 3 (T059-T071) - starts after US1 components exist
3. **Integrate**: Review, merge, test together
4. **Polish together**: Phase 6 (T072-T098)

---

## Task Summary

### Total Tasks: 98

### Tasks by Phase:
- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 12 tasks (BLOCKS all user stories)
- **Phase 3 (User Story 1 - MVP)**: 26 tasks
- **Phase 4 (User Story 2)**: 13 tasks
- **Phase 5 (User Story 3)**: 13 tasks
- **Phase 6 (Polish)**: 27 tasks

### Tasks by User Story:
- **US1** (Video Playback with Subtitle Display): 26 tasks
- **US2** (Automatic Subtitle Highlighting): 13 tasks
- **US3** (Manual Subtitle Highlighting): 13 tasks
- **Infrastructure** (Setup + Foundational + Polish): 46 tasks

### Parallel Opportunities:
- **Phase 1**: 6 tasks can run in parallel (T002-T007)
- **Phase 2**: 9 tasks can run in parallel (T008-T013, T014, T016, T019)
- **Phase 3**: Up to 15 tasks can run in parallel at various stages
- **Phase 4**: Up to 5 tasks can run in parallel
- **Phase 5**: Up to 5 tasks can run in parallel
- **Phase 6**: Up to 20 tasks can run in parallel

### Independent Test Criteria:

**User Story 1**:
- ✅ Can enter valid Bilibili URL and see video player
- ✅ Native subtitles display if available
- ✅ AI generates subtitles if none available (with progress indicator)
- ✅ Cached subtitles load instantly on repeat visit
- ✅ Error messages display for invalid URLs/videos

**User Story 2**:
- ✅ Current subtitle highlights in yellow during playback
- ✅ Highlight updates as video plays
- ✅ Highlight persists when paused
- ✅ Highlight updates when seeking

**User Story 3**:
- ✅ Click subtitle to add blue border highlight
- ✅ Click again to remove highlight
- ✅ Multiple highlights can exist simultaneously
- ✅ Highlights persist across page reloads
- ✅ Both active (yellow) and user (blue) highlights visible together

### Suggested MVP Scope:
**User Story 1 only** (Phases 1-3, tasks T001-T045)

This delivers core value:
- Video loading and playback
- Native subtitle display
- AI subtitle generation for videos without subtitles
- Caching for performance
- Complete error handling

Users can watch videos with subtitles - a complete, valuable experience.

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD Required**: Write tests FIRST, verify they FAIL, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = User Story 1 only (26 tasks after setup + foundational)
- Constitution requires 80% test coverage - verify with `npm test -- --coverage`
