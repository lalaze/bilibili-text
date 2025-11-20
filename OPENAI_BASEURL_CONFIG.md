# OpenAI Base URL 自定义配置指南

## 概述

本项目支持自定义 OpenAI API 的 Base URL，允许你使用代理服务、国内中转服务或其他兼容 OpenAI API 的服务。

## 配置方法

### 1. 基本配置

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# 必需：API Key
OPENAI_API_KEY=your-api-key-here

# 可选：自定义 Base URL
OPENAI_BASE_URL=https://your-custom-endpoint.com/v1
```

### 2. 常见配置场景

#### 场景 A: 使用官方 OpenAI API（默认）

```bash
OPENAI_API_KEY=sk-xxx
# 不设置 OPENAI_BASE_URL，自动使用官方 API
```

#### 场景 B: 使用国内代理/中转服务

```bash
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.your-proxy.com/v1
```

**常见国内代理服务**：
- API2D: `https://openai.api2d.net/v1`
- OpenAI-SB: `https://api.openai-sb.com/v1`
- 自建代理: `https://your-proxy.com/v1`

#### 场景 C: 使用 Azure OpenAI Service

```bash
# Azure OpenAI 使用不同的认证方式
OPENAI_API_KEY=your-azure-api-key
OPENAI_BASE_URL=https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name
```

**注意**: Azure OpenAI 可能需要额外的配置，具体参考 [Azure OpenAI 文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

#### 场景 D: 使用其他兼容服务

任何兼容 OpenAI API 格式的服务都可以使用：

```bash
OPENAI_API_KEY=your-service-key
OPENAI_BASE_URL=https://compatible-service.com/v1
```

### 3. 验证配置

#### 检查环境变量

```bash
# 在项目根目录运行
node -e "require('dotenv').config({path:'.env.local'}); console.log('API Key:', process.env.OPENAI_API_KEY?.slice(0,10)+'...'); console.log('Base URL:', process.env.OPENAI_BASE_URL || 'Default (https://api.openai.com/v1)');"
```

#### 测试 API 连接

创建测试脚本 `test-openai.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

async function test() {
  try {
    console.log('Testing OpenAI API connection...');
    console.log('Base URL:', openai.baseURL);
    
    const models = await openai.models.list();
    console.log('✓ Connection successful!');
    console.log('Available models:', models.data.slice(0, 3).map(m => m.id));
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  }
}

test();
```

运行测试：
```bash
node test-openai.js
```

## 代码实现细节

### API 路由中的使用

在 `app/api/bilibili/speech/transcribe/route.ts` 中：

```typescript
import OpenAI from 'openai';

// 初始化客户端时传入 baseURL
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 可选，如未设置则使用默认值
});

// 调用 Whisper API
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'zh',
  response_format: 'verbose_json',
  timestamp_granularities: ['segment']
});
```

## 故障排查

### 问题 1: 连接超时

**症状**: API 请求超时

**解决方案**:
1. 检查 Base URL 格式是否正确（必须以 `/v1` 结尾）
2. 确认代理服务是否正常运行
3. 检查防火墙/网络设置

### 问题 2: 认证失败

**症状**: `401 Unauthorized` 错误

**解决方案**:
1. 确认 API Key 是否正确
2. 检查代理服务是否需要特殊的 API Key 格式
3. 验证 API Key 是否有相应权限

### 问题 3: 模型不可用

**症状**: `Model not found` 错误

**解决方案**:
1. 确认使用的服务是否支持 `whisper-1` 模型
2. 查看服务商文档了解支持的模型列表
3. 如使用 Azure，确认已部署 Whisper 模型

### 问题 4: Base URL 格式错误

**常见错误**:
- ❌ `https://api.example.com` (缺少 `/v1`)
- ❌ `https://api.example.com/v1/` (多余的结尾斜杠)
- ✓ `https://api.example.com/v1` (正确格式)

## 安全注意事项

### 1. 保护 API Key

```bash
# .gitignore 中确保忽略环境变量文件
.env.local
.env*.local
```

### 2. 不要在客户端使用

❌ **错误做法**:
```javascript
// 客户端代码 - 会暴露 API Key！
const openai = new OpenAI({
  apiKey: 'sk-xxx', // 危险！
  dangerouslyAllowBrowser: true
});
```

✓ **正确做法**:
```javascript
// 始终通过服务端 API 路由调用
const response = await fetch('/api/bilibili/speech/transcribe', {
  method: 'POST',
  body: JSON.stringify({ videoId, audioUrl })
});
```

### 3. 速率限制

大多数代理服务都有速率限制，建议：
- 实现请求队列
- 添加重试机制
- 监控 API 使用量

## 成本优化

### 使用代理服务的优势

1. **降低成本**: 部分代理服务价格更低
2. **网络加速**: 国内访问更快
3. **简化部署**: 无需处理网络问题

### 监控 API 使用

```typescript
// 添加日志记录
console.log(`Transcription started: ${videoId}`);
console.log(`Audio duration: ${duration}s`);
console.log(`Estimated cost: $${(duration / 60 * 0.006).toFixed(4)}`);
```

## 推荐配置

### 开发环境

```bash
# 使用免费额度或低成本代理
OPENAI_API_KEY=sk-dev-xxx
OPENAI_BASE_URL=https://dev-proxy.com/v1
```

### 生产环境

```bash
# 使用稳定的服务
OPENAI_API_KEY=sk-prod-xxx
OPENAI_BASE_URL=https://api.openai.com/v1  # 或可靠的代理
```

### 测试环境

```bash
# 使用 Mock 服务避免实际调用
OPENAI_API_KEY=test-key
OPENAI_BASE_URL=http://localhost:3001/mock-openai/v1
```

## 相关资源

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [OpenAI Node SDK](https://github.com/openai/openai-node)
- [Azure OpenAI 文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

## 示例：完整配置

```bash
# .env.local
# ===================
# OpenAI API 配置
# ===================

# API Key（必需）
OPENAI_API_KEY=sk-your-key-here

# Base URL（可选）
# 场景 1: 官方 API（默认，可不设置）
# OPENAI_BASE_URL=https://api.openai.com/v1

# 场景 2: 使用代理
OPENAI_BASE_URL=https://your-proxy.com/v1

# ===================
# 应用配置
# ===================

NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_VIDEO_DURATION=7200
MAX_AUDIO_SIZE=26214400

# ===================
# 调试选项（可选）
# ===================

# 启用详细日志
# DEBUG=openai:*
```

---

**提示**: 修改 `.env.local` 后需要重启开发服务器才能生效。

```bash
# 停止服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```



