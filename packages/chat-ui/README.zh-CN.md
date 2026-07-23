# aix-chat

开箱即用的 Vue 3 AI 聊天组件。支持流式响应、自定义卡片、语音输入、图片上传、明暗主题。

[English](./README.md)

## 安装

```bash
npm install aix-chat
```

就这样 — `aix-chat` 内置了 `vue-i18n`，不需要额外配置。

## 最简用法

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
</script>

<template>
  <ChatApp agent-id="my-agent" api-base="http://localhost:3000" />
</template>
```

三行代码，一个完整的聊天界面就跑起来了。

## 完整示例

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
    agent-id="order-assistant"
    api-base="http://localhost:3000"
    :headers="headers"
    assistant-name="订单助手"
    assistant-avatar="/ai-avatar.png"
    user-name="张三"
    :tools="tools"
    system-prompt="你是一个专业的订单助手。"
    :welcome="{
      text: '你好！有什么可以帮你的？',
      quickReplies: [
        { label: '下订单', value: '我想下一个新订单' },
        { label: '查订单', value: '帮我查最近的订单' }
      ]
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    input-placeholder="请输入您的问题..."
  />
</template>
```

## Props

#### 必填

| Prop | 类型 | 说明 |
|------|------|------|
| `agent-id` | `string` | Agent 标识符 |

#### API 配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api-base` | `string` | `''` | API 基础地址 |
| `api-endpoint` | `string` | `'/api/agent/chat'` | API 端点路径 |
| `headers` | `Record<string, string> \| () => Record<string, string>` | `{}` | 请求头（支持函数，每次请求时调用） |

#### 外观

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `assistant-name` | `string` | `''` | 助手名称 |
| `assistant-avatar` | `string` | `''` | 助手头像 URL |
| `user-name` | `string` | `''` | 用户名称 |
| `user-avatar` | `string` | `''` | 用户头像 URL |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题 |
| `show-header` | `boolean` | `true` | 显示头部 |
| `input-placeholder` | `string` | `''` | 输入框占位符 |

#### 功能开关

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable-voice` | `boolean` | `true` | 语音输入 |
| `enable-image-upload` | `boolean` | `true` | 图片上传 |
| `enable-reset` | `boolean` | `true` | 重置对话按钮 |
| `enable-reasoning` | `boolean` | `true` | 思考过程展示 |
| `max-image-size` | `number` | `5242880` | 最大图片大小（字节） |

#### 内容与工具

| Prop | 类型 | 说明 |
|------|------|------|
| `system-prompt` | `string` | 系统提示词 |
| `welcome` | `{ text: string, quickReplies?: Array<{ label: string, value: string }> }` | 欢迎消息 |
| `tools` | `ToolConfig[] \| defineTools()` | 工具定义（见下方） |

## 自定义工具 & 卡片

用 `defineTools()` 定义工具 — AI 调用工具时，自动渲染你指定的 Vue 卡片组件。

```ts
import { defineTools } from 'aix-chat'
import OptionCard from './OptionCard.vue'

export const tools = defineTools([
  {
    name: 'showOptions',
    description: '展示选项让用户选择',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        options: { type: 'array', items: { type: 'object' } }
      },
      required: ['title', 'options']
    },
    component: OptionCard,
    mapProps: (args) => ({ title: args.title, options: args.options }),
    execute: async (args) => ({ pending: true, ...args }),
    onEvent: (eventName, data) => console.log(eventName, data)
  }
])
```

然后在 `ChatApp` 上传入 `:tools="tools"` 即可。AI 决定调用工具时，`OptionCard` 组件会自动渲染在聊天气泡中。

## 其他用法

### `mountChat()` — 一行挂载（无需 Vue SFC）

```ts
import { mountChat } from 'aix-chat'
import 'aix-chat/style.css'

const { unmount } = mountChat('#app', {
  agentId: 'my-agent',
  apiBase: 'http://localhost:3000'
})
```

适合快速验证、非 Vue 项目、或嵌入式场景。

### `createChat()` — 完全自定义 UI

如果你想自己画界面，只要聊天逻辑：

```ts
import { createChat } from 'aix-chat'

const { chat, sendMessage, chatBusy, pendingToolCall, resolve } = createChat({
  agentId: 'my-agent',
  apiBase: 'http://localhost:3000',
  tools: tools.schemas,
  onToolCall: async (name, args) => { /* 自己处理工具调用 */ }
})

await sendMessage({ text: '你好' })
```

## 样式定制

```scss
// 导入卡片样式 mixin
@use 'aix-chat/styles/chat-card';
```

通过 `./styles/*` 可以引用更多源样式文件：

```ts
import 'aix-chat/styles/variables'
```

## Claude Code Skills

安装后，Claude Code Skills 会自动链接到你项目的 `.claude/skills` 目录。

**不会写代码？没关系。** 在 Claude Code 里直接问：

- "帮我添加一个 AI 聊天卡片"
- "怎么创建一个聊天工具？"
- "对接后端 Agent API"

Claude 会自动加载 `ai-chat-integration` skill，一步步指导你完成。

如果自动链接失败，手动操作：

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

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

SSE 流，使用 [AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) 协议。用 `ai` 包的 `streamText()` + `toUIMessageStream()` 生成。

### 最小后端实现（Vercel AI SDK）

```ts
// POST /api/agent/chat
import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { messages, tools = [], systemPrompt } = await req.json()

  // 将工具定义转为 AI SDK 格式
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

支持 AI SDK 的任何 AI 提供商 — OpenAI、Anthropic、Google、DashScope（通义千问）、Ollama 等，只需换 provider。

完整的数据库持久化实现请看 Claude Code Skills 里的 `references/backend-api-guide.md`。

## 技术栈

- Vue 3 + TypeScript
- AI SDK v7 (`ai` + `@ai-sdk/vue`)
- Pinia 状态管理

## License

MIT
