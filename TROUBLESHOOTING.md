# 故障排查指南

## 语音识别卡在 "准备开始语音识别..." 的问题

### 问题描述
当视频没有原生字幕时，应用会尝试使用语音识别生成字幕，但状态会卡在 "准备开始语音识别..." (pending)。

### 根本原因
语音识别功能有两个尚未实现的部分：

1. **缺少 OpenAI API 密钥配置** (如果未配置)
   - API 会返回 500 错误: "OpenAI API key not configured"
   
2. **音频提取功能未实现** (即使配置了 API 密钥)
   - API 会返回 501 错误: "Audio extraction not yet implemented"

### 当前行为（修复后）

应用现在会**明确显示错误信息**，而不是停留在 pending 状态：

#### 场景 1: 未配置 OpenAI API 密钥
```
语音识别失败
OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local
详细信息: Refer to OPENAI_BASEURL_CONFIG.md for configuration instructions
```

#### 场景 2: 已配置 API 密钥但功能未实现
```
语音识别失败
Audio extraction not yet implemented
详细信息: This feature requires implementing: 1) Bilibili video download, 2) Audio extraction with ffmpeg, 3) OpenAI Whisper API integration
```

### 临时解决方案

目前语音识别功能尚未完全实现。如果视频没有原生字幕，请：

1. **选择有字幕的视频进行测试**
   - B站大部分UP主上传的视频都有CC字幕
   
2. **查看控制台日志**
   - 打开浏览器开发者工具 (F12)
   - 查看 Console 和 Network 标签页了解详细错误

3. **参考错误提示**
   - 错误信息会详细说明缺少什么配置或功能

### 完整实现语音识别功能需要的步骤

#### 第一步：配置 OpenAI API 密钥

1. 在项目根目录创建 `.env.local` 文件：
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   # 可选：如果使用代理或国内中转
   # OPENAI_BASE_URL=https://your-proxy.com/v1
   ```

2. 重启开发服务器：
   ```bash
   npm run dev
   ```

详细配置说明请参考 `OPENAI_BASEURL_CONFIG.md`

#### 第二步：实现音频提取功能

这需要在服务端实现以下功能（在 `app/api/bilibili/speech/transcribe/route.ts`）：

1. **从 Bilibili 下载视频**
   - 需要获取实际的视频流 URL
   - Bilibili API 可能需要认证和特殊处理
   
2. **提取音频轨道**
   - 使用 ffmpeg 或类似工具
   - 转换为 Whisper 支持的格式 (mp3, mp4, mpeg, mpga, m4a, wav, webm)
   
3. **调用 OpenAI Whisper API**
   ```typescript
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     baseURL: process.env.OPENAI_BASE_URL,
   })
   
   const transcription = await openai.audio.transcriptions.create({
     file: audioFile,
     model: 'whisper-1',
     language: 'zh',
     response_format: 'verbose_json',
     timestamp_granularities: ['segment']
   })
   ```

4. **解析响应并缓存**
   - 将 Whisper 响应转换为 SubtitleSegment 格式
   - 缓存到 IndexedDB 以提高后续加载速度

### 相关文件

- `app/api/bilibili/speech/transcribe/route.ts` - 语音识别 API 端点
- `services/speechRecognition.ts` - 语音识别服务
- `hooks/useSubtitles.ts` - 字幕加载 Hook
- `app/video/[videoId]/page.tsx` - 视频页面组件
- `components/SpeechRecognitionStatus.tsx` - 状态显示组件
- `OPENAI_BASEURL_CONFIG.md` - OpenAI 配置指南

### 测试方法

1. **测试有字幕的视频**（当前可用）：
   ```
   输入任何有 CC 字幕的 B 站视频 URL
   应该能正常加载和显示字幕
   ```

2. **测试无字幕的视频**（会看到错误提示）：
   ```
   输入没有字幕的 B 站视频 URL
   会看到清晰的错误信息，说明缺少什么配置或功能
   ```

### 开发注意事项

- ✅ 错误会被正确捕获和显示
- ✅ 不会再卡在 "pending" 状态
- ✅ 错误信息包含详细的解决建议
- ⚠️ 语音识别功能需要额外开发工作
- ⚠️ 音频提取可能需要后端服务支持

## 其他常见问题

### 问题：语音识别失败后疯狂重试

**症状**：
- 语音识别失败后不断重试
- 控制台充满重复的错误日志
- 网络面板显示大量失败的 API 请求

**原因**：
- useEffect 依赖项在失败后没有变化
- 导致 effect 不断重新执行

**解决方法**（已修复）：
- ✅ 添加 `hasAttemptedTranscription` 状态追踪是否已尝试
- ✅ 失败后设置此标记，防止自动重试
- ✅ 提供"重试"按钮让用户手动重试
- ✅ 切换视频时自动重置状态

**用户操作**：
1. 看到错误信息后，点击"重试"按钮手动重试
2. 或者切换到其他视频
3. 错误不会自动重试了

### 问题：视频加载失败

**可能原因**：
- 视频 ID 格式错误
- 视频不存在或已删除
- 视频受地区限制

**解决方法**：
- 检查控制台错误信息
- 尝试在 B 站网页上直接访问视频
- 使用其他视频进行测试

### 问题：字幕不同步

**可能原因**：
- 视频播放器和字幕时间轴不匹配
- B 站嵌入播放器的时间更新延迟

**解决方法**：
- 这是已知限制，需要改进同步算法
- 参考 `hooks/useSubtitleSync.ts` 进行调整

---

最后更新：2025-11-20



