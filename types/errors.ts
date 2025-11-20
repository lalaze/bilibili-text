// types/errors.ts
// Centralized error type definitions

import { VideoError } from './video'
import { SubtitleError } from './subtitle'
import { StorageError } from './highlight'

export type AppError = VideoError | SubtitleError | StorageError

export interface ApiError {
  error: {
    code: string // Machine-readable error code
    message: string // Human-readable error message
    details?: string // Additional error details
    timestamp: string // ISO 8601 timestamp
  }
}

export class BilibiliError extends Error {
  constructor(
    public code: AppError,
    message: string,
    public details?: string
  ) {
    super(message)
    this.name = 'BilibiliError'
  }
}

export const ERROR_MESSAGES: Record<AppError, string> = {
  // Video errors
  VIDEO_NOT_FOUND: '视频不存在或已被删除',
  VIDEO_RESTRICTED: '视频受地区限制或需要登录',
  EMBED_BLOCKED: '该视频禁止嵌入播放',
  INVALID_VIDEO_ID: '视频ID格式无效',
  FETCH_FAILED: '获取视频数据失败',

  // Subtitle errors
  NO_SUBTITLES: '该视频没有字幕',
  SUBTITLE_FETCH_FAILED: '获取字幕失败',
  SUBTITLE_PARSE_ERROR: '字幕解析错误',
  INVALID_PARAMS: '参数无效',

  // Storage errors
  QUOTA_EXCEEDED: '存储空间已满，请清理旧的高亮标记',
  STORAGE_UNAVAILABLE: '浏览器存储不可用',
}

