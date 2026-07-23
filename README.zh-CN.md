# AIX Chat

一个简洁的 AI 聊天组件库和演示项目。提供开箱即用的 Vue 3 聊天界面，支持自定义工具、卡片组件、流式响应等功能。

[English](./README.md)

## 项目结构

```
aix-chat/
├── packages/
│   ├── chat-ui/       # AI 聊天组件库（npm: aix-chat）
│   ├── demo/          # 订单助手演示
│   └── server/        # 后端 API（简化版）
├── package.json       # Monorepo 配置
└── pnpm-workspace.yaml
```

## 快速开始

### 1. 安装依赖

```bash
cd aix-chat
pnpm install
```

### 2. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker-compose up -d

# 验证数据库运行
docker-compose ps
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 OpenAI API Key
```

### 4. 启动服务

```bash
# 启动后端（端口 3000）
pnpm dev:server

# 启动前端（端口 5173）
pnpm dev:ui
```

访问 http://localhost:5173

## 核心特性

### 前端（aix-chat）

- **ChatApp 组件**：完整的聊天界面，开箱即用
- **工具定义**：通过 `defineTools` 定义工具和卡片
- **自动处理**：卡片注册、事件路由、pending 状态全部自动
- **响应式设计**：支持移动端和桌面端
- **AI SDK v7**：使用最新的 `useChat` composable，支持流式响应

### 后端（aix-chat-server）

- **极简设计**：只有一个 `/api/agent/chat` 端点
- **流式响应**：支持 SSE 流式输出
- **工具支持**：接收前端工具定义，传给 AI
- **PostgreSQL 存储**：使用 Docker 运行的 PostgreSQL 存储对话历史

### 数据库

项目使用 Docker 运行 PostgreSQL 数据库来持久化存储聊天记录：

```bash
# 启动数据库
docker-compose up -d

# 查看数据库日志
docker-compose logs -f postgres

# 停止数据库
docker-compose down

# 停止并删除数据
docker-compose down -v
```

数据库连接信息：
- **Host**: localhost:5432
- **User**: aix
- **Password**: aix123
- **Database**: aix_chat
- **Connection String**: `postgresql://aix:aix123@localhost:5432/aix_chat`

## 使用示例

### 安装

```bash
npm install aix-chat
```

### 基础用法

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
</script>

<template>
  <ChatApp
    agent-id="my-agent"
    api-base="http://localhost:3000"
  />
</template>
```

### 定义工具

```typescript
import { defineTools } from 'aix-chat'
import OptionCard from './OptionCard.vue'

export const tools = defineTools([
  {
    name: 'showOptions',
    description: '展示选项',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        options: { type: 'array' }
      }
    },
    component: OptionCard,
    mapProps: (args) => ({ title: args.title, options: args.options }),
    execute: async (args) => ({ pending: true, ...args }),
    onEvent: (eventName, data) => console.log(eventName, data)
  }
])
```

### 使用 ChatApp

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
import { tools } from './tools'

const headers = {
  Authorization: `Bearer ${yourToken}`
}
</script>

<template>
  <ChatApp
    agent-id="my-agent"
    api-base="http://localhost:3000"
    :tools="tools"
    :headers="headers"
    system-prompt="你是助手..."
    :welcome="{
      text: '你好！有什么可以帮你的？',
      quickReplies: [
        { label: '操作 A', value: '执行操作 A' },
        { label: '操作 B', value: '执行操作 B' }
      ]
    }"
  />
</template>
```

完整的组件文档请看 [packages/chat-ui/README.zh-CN.md](./packages/chat-ui/README.zh-CN.md)。

## 后端对接

组件对接一个 SSE 流式端点（默认：`POST /api/agent/chat`）。你的后端接收消息 + 工具定义，调用 LLM，流式返回响应。

### 请求格式

```json
{
  "agentId": "my-agent",
  "messages": [{ "role": "user", "content": "你好" }],
  "tools": [
    { "name": "showOptions", "description": "...", "parameters": { ... } }
  ],
  "systemPrompt": "你是助手..."
}
```

### 响应格式

SSE 流，使用 [AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) 协议。

### 最小后端实现

```ts
import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { messages, tools = [], systemPrompt } = await req.json()

  const aiTools = Object.fromEntries(
    tools.map((t: any) => [t.name, { description: t.description, parameters: t.parameters }])
  )

  const result = streamText({
    model: openai('gpt-4o-mini'),
    instructions: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: aiTools,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }),
  })
}
```

支持 AI SDK 的任何 AI 提供商 — OpenAI、Anthropic、Google、DashScope（通义千问）、Ollama 等。

完整的组件文档请看 [packages/chat-ui/README.zh-CN.md](./packages/chat-ui/README.zh-CN.md)。

## Claude Code Skills

本项目包含 Claude Code Skills，帮助你快速集成 AI 聊天功能。

安装 `aix-chat` 后，skills 会自动链接到项目的 `.claude/skills` 目录。

### 使用 Skills

在 Claude Code 中，你可以直接询问：

- "如何添加 AI 聊天卡片？"
- "怎么创建聊天工具？"
- "如何对接后端 API？"
- "卡片组件怎么开发？"

Claude 会自动使用 `ai-chat-integration` skill 来指导你完成开发。

### 手动启用 Skills

如果自动链接失败，可以手动复制：

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

## 开发

```bash
# 构建所有包
pnpm build

# 只构建 chat-ui
pnpm build:ui

# 只构建 server
pnpm build:server

# 开发模式（监听变化）
pnpm dev:ui
```

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **AI SDK**：ai v7 + @ai-sdk/vue v4（useChat composable）
- **后端**：Fastify + AI SDK
- **AI**：OpenAI GPT-4
- **Monorepo**：pnpm workspaces

## License

MIT
