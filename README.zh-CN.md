# AIX Chat

一个 Vue 3 AI 聊天组件库，附带可直接运行的「订单助手」演示和后端服务。

[English](./README.md)

## 仓库结构

| 路径 | 包名 | 说明 | 运行端口 |
|------|------|------|----------|
| `packages/chat-ui` | `aix-chat` | 组件库本体 —— 流式聊天界面、自定义工具卡片、语音与图片输入、明暗主题 | 发布到 npm |
| `packages/demo` | `aix-chat-demo` | 订单助手演示应用（Vite + Vue 3） | http://localhost:5173 |
| `packages/server` | `aix-chat-server` | 后端 —— SSE 聊天端点、工具透传、PostgreSQL 会话记录 | http://localhost:3000 |

只有 `packages/chat-ui` 会发布到 npm。demo 与 server 是参考实现：按需取用，或直接换成你自己的后端（见[后端接口](#后端接口)）。

## 前置要求

| 要求 | 原因 |
|------|------|
| **Node.js ≥ 20.19** | `packages/chat-ui` 使用 Vite 8 构建（要求 `^20.19 \|\| >=22.12`）。开发环境为 Node 24。 |
| **pnpm ≥ 9** | 本仓库是 pnpm workspace（`pnpm-workspace.yaml`），npm 与 yarn 无法解析 `workspace:*` 链接。开发环境为 pnpm 11.4。 |
| **Docker** | 用于运行 PostgreSQL 容器。若已有 PostgreSQL 16，可跳过并改 `DATABASE_URL`。 |

## 快速开始

```bash
# 1. 安装 workspace 依赖
pnpm install

# 2. 创建环境变量文件 —— 后端启动时读取
cp .env.example .env
#    → 然后编辑 .env，填入 DASHSCOPE_API_KEY

# 3. 启动 PostgreSQL
docker compose up -d                 # 旧版 Docker CLI：docker-compose up -d
docker compose ps                    # 等到容器状态为 healthy

# 4. 启动后端（端口 3000）
pnpm dev:server
#    → ✅ Database connected successfully
#    → 🚀 Server running on http://localhost:3000

# 5. 另开一个终端启动演示（端口 5173）
pnpm dev:ui
```

打开 http://localhost:5173 发送一条消息。也可以单独确认后端是否正常：

```bash
curl -s localhost:3000/health        # {"status":"ok","timestamp":"..."}
```

`pnpm dev` 会同时运行所有包的 dev 脚本 —— 组件库 watch 构建、演示、后端 —— 日志会交错在一起。分两个终端更容易排查问题。

## 配置

全部配置都通过两个 `.env` 文件完成，跑通演示不需要改动任何源码。

### 哪个文件配置什么

| 文件 | 被谁读取 | 放什么 |
|------|----------|--------|
| `.env`（仓库根目录） | 后端，经 `packages/server/src/env.ts` 加载 | API Key、模型、`DATABASE_URL`、`PORT` |
| `packages/demo/.env` | 演示应用（Vite） | `VITE_*` 前端变量 |

两者分开是刻意的：Vite 只会加载它构建的那个应用目录内的 `.env`，且只有 `VITE_` 前缀的变量会暴露给浏览器。**API Key 绝不能放进 `VITE_` 变量** —— 该前缀的变量会进客户端产物。

服务端是按文件自身的位置（而非当前工作目录）去解析根 `.env` 的，因此无论用 `pnpm dev:server`、`tsx src/server.ts` 还是从任意目录执行 `node dist/server.js`，读取结果都一致。

### 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DASHSCOPE_API_KEY` | **是** | — | OpenAI 兼容供应商的 API Key。留空时服务端能启动，但每次聊天请求都会失败（启动时会给出告警）。变量名是历史遗留 —— 无论换哪家供应商，Key 都填在这里。 |
| `OPENAI_API_URL` | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI 兼容 API 的 Base URL。 |
| `TEXT_MODEL` | 否 | `qwen3.6-plus` | 传给供应商的模型名。 |
| `DATABASE_URL` | 否 | `postgresql://aix:aix123@localhost:5432/aix_chat` | PostgreSQL 连接串，默认值与 `docker-compose.yml` 一致。 |
| `PORT` | 否 | `3000` | 后端 HTTP 端口。 |
| `VITE_API_KEY` | 否 | — | **仅演示前端**，配置在 `packages/demo/.env`。会作为 `x-api-key` 请求头发出；自带的模板服务端并不校验它。 |

### 切换模型或供应商

`packages/server/src/routes/agent-chat.ts:10` 用 `createOpenAICompatible` 创建客户端，因此任何 OpenAI 兼容端点都能直接用 —— 改下面三个变量后重启服务端即可：

| 供应商 | `.env` |
|--------|--------|
| DashScope / Qwen（默认） | `OPENAI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1` · `TEXT_MODEL=qwen3.6-plus` |
| OpenAI | `OPENAI_API_URL=https://api.openai.com/v1` · `TEXT_MODEL=gpt-4o-mini` |
| Ollama（本地） | `OPENAI_API_URL=http://localhost:11434/v1` · `TEXT_MODEL=llama3.1`（Key 填任意非空值） |
| vLLM / OpenRouter 等其他网关 | 把 `OPENAI_API_URL` 指向它即可，同样是这三个变量 |

若供应商只有自己的 SDK、没有 OpenAI 兼容接口，就把 `createOpenAICompatible` 换成对应的工厂函数（例如 `@ai-sdk/anthropic` 的 `createAnthropic`，需在 `packages/server` 下安装该依赖）。

### 数据库

`docker-compose.yml` 以 `aix-postgres` 为容器名运行 PostgreSQL 16：用户 `aix`、密码 `aix123`、库名 `aix_chat`、端口 `5432`，数据存放在具名卷 `postgres_data`。

`init.sql` **只在数据卷首次创建时执行一次**，它会建好：

- `conversations` —— `id`、`agent_id`、`user_id`、`created_at`、`updated_at`
- `messages` —— `id`、`conversation_id`、`role`、`content`、`tool_calls`（jsonb）、`tool_call_id`、`created_at`
- `agent_id`、`user_id`、`conversation_id`、`created_at` 上的索引

```bash
docker compose up -d        # 启动
docker compose logs -f postgres
docker compose down         # 停止，保留数据
docker compose down -v      # 停止并删除数据卷（下次启动会重新执行 init.sql）
```

服务端在启动时会测试数据库连接，**连不上就以退出码 1 直接退出** —— 数据库未启动是硬失败，不会降级运行。如果改用自己的 `DATABASE_URL`，请先停掉容器；另外注意表结构变更需要 `docker compose down -v` 或手动执行 `init.sql`（已有数据卷不会重跑初始化脚本）。

### 端口

| 端口 | 用途 | 修改方式 |
|------|------|----------|
| `3000` | 后端 | `.env` 中的 `PORT` |
| `5173` | 演示开发服务器 | `packages/demo/vite.config.ts` 中的 `server.port` |
| `5432` | PostgreSQL 容器 | `docker-compose.yml` 中的 `ports`（同时要改 `DATABASE_URL`） |

### 语音输入需要一个语音识别接口

语音输入只负责录音并上传，不做本地识别：

```
POST <sttEndpoint>          默认：/api/stt/open（相对页面来源）
Content-Type: application/json
{ "base64": "data:audio/webm;base64,...", "sender": "<用户标识>" }

→ { "text": "识别出的文字" }
```

**自带的后端并未实现该路由**，因此演示里的麦克风按钮会报错。要让语音可用，需要在自己的后端补上 `POST /api/stt/open`（在演示里，Vite 的 `/api` 代理已经会把它转发到 3000 端口）。

另外注意：`<ChatApp>` 没有暴露该 URL 的 prop，它内部构建配置时未传 `sttEndpoint`，因此始终使用默认的 `/api/stt/open`。若现在就需要换成别的路径，请使用下面 `defineChatConfig()` + `AiChatProvider` 的底层组合方式（见 [packages/chat-ui/README.zh-CN.md](./packages/chat-ui/README.zh-CN.md)）。

### 演示是如何访问后端的

`packages/demo/src/App.vue` 设置了 `api-base="http://localhost:3000"`，即浏览器**跨域**直连后端，靠服务端的 CORS 头（`origin: true`、允许携带凭证）才得以放行。`packages/demo/vite.config.ts` 里也配了 `/api` 到 3000 端口的代理，如果你更希望同源请求，就改用代理方式 —— 此时把 `api-base` 留空、保留 `api-endpoint="/api/agent/chat"`。

## 使用组件库

### 安装

```bash
npm install aix-chat
```

`aix-chat` 依赖以下 peerDependencies。npm（≥ 7）与 pnpm（≥ 8）会自动安装 peer 依赖，yarn 不会 —— 若出现 peer 警告，或想自己锁定版本，请显式安装：

| Peer | 版本 |
|------|------|
| `vue` | `^3.5.0` |
| `ai` | `^7.0.0` |
| `@ai-sdk/vue` | `^4.0.0` |

```bash
pnpm add aix-chat ai@^7 @ai-sdk/vue@^4
```

**i18n 无需任何配置。** 自 v1.0.4 起 `vue-i18n` 已作为普通依赖内置，组件在未检测到 i18n 时会回退到内置的 `en`/`zh` 语言包，因此你不需要自己调用 `app.use(i18n)`。旧版本（≤ 1.0.3）会抛出 `SyntaxError: Need to install with app.use function`，详见[常见问题](#常见问题)。

### 最简用法

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
</script>

<template>
  <ChatApp agent-id="my-agent" api-base="http://localhost:3000" />
</template>
```

### 完整示例

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
    api-endpoint="/api/agent/chat"
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
        { label: '查询订单', value: '帮我查询最近的订单' }
      ]
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    input-placeholder="请输入您的问题..."
  />
</template>
```

### ChatApp 的 Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `agent-id` | `string` | — | **必填**。会话记录里使用的 Agent 标识。 |
| `api-base` | `string` | `''` | 后端地址，如 `http://localhost:3000`。留空表示同源。 |
| `api-endpoint` | `string` | `'/api/agent/chat'` | 拼接在 `api-base` 之后的路径。 |
| `headers` | `Record<string, string> \| () => Record<string, string>` | `undefined` | 请求头。传函数可在每次请求时动态取 token。 |
| `assistant-name` / `assistant-avatar` | `string` | `''` | 助手名称与头像地址。 |
| `user-name` / `user-avatar` | `string` | `''` | 用户名称与头像地址。 |
| `sender` | `string` | `''` | 用户标识，会随语音识别请求一起发出。 |
| `system-prompt` | `string` | `undefined` | 每次请求都会携带的系统提示词。 |
| `welcome` | `{ text: string, quickReplies?: { label: string, value: string }[] }` | `undefined` | 作为第一条助手消息注入，可带快捷回复按钮。 |
| `tools` | `ToolConfig[] \| defineTools()` | `undefined` | 工具定义，见下文。 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题，`auto` 跟随系统。 |
| `show-header` | `boolean` | `true` | 是否显示顶部栏。 |
| `show-empty-state` | `boolean` | `true` | 首条消息之前是否显示空状态。 |
| `input-placeholder` | `string` | `''` | 输入框占位文字。 |
| `enable-voice` | `boolean` | `true` | 语音输入（需要后端提供语音识别接口，见上文）。 |
| `enable-image-upload` | `boolean` | `true` | 图片上传与粘贴。 |
| `enable-reset` | `boolean` | `true` | 重置会话按钮。 |
| `enable-reasoning` | `boolean` | `true` | 是否展示模型思考过程。 |
| `max-image-size` | `number` | `5242880` | 图片大小上限（字节，即 5 MB）。 |

### defineChatConfig

`<ChatApp>` 只是一层薄封装：它把 props 转成配置对象交给 `defineChatConfig()`，再渲染 `<AiChatProvider>`。当你自己组合 UI，或需要 `<ChatApp>` 未暴露的配置项时，可以直接用它：

```ts
import { defineChatConfig } from 'aix-chat'

const config = defineChatConfig({
  transport: { api: '/api/chat', headers: { 'x-api-key': '...' } },
  voice: { enabled: true, sttEndpoint: '/my/stt', sender: 'user-1' },
  ui: { theme: 'light', inputPlaceholder: '请输入问题...' },
  avatar: { assistantName: '助手', userName: '张三' },
  cards: { pending: { showOptions: OptionCard }, completed: {} },
  toolDisplayNames: { showOptions: 'tool.showOptions' },
  welcome: { text: '你好！', quickReplies: [{ label: '帮助', value: 'help' }] }
})
```

它的默认值与 props 的默认值**并不一致**，这是最容易踩的坑：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `transport.api` | `'/api/chat'` | **不是** `/api/agent/chat`，需要自己指定。 |
| `transport.headers` | `{}` | |
| `transport.buildBody` | `({ context, sender }) => ({ context, sender })` | 重写它以调整请求体结构。 |
| `voice.enabled` | `true` | |
| `voice.sttEndpoint` | `'/api/stt/open'` | |
| `voice.sender` | `''` | |
| `ui.*` | 与 props 一致：`showHeader`/`showEmptyState`/`enableImageUpload`/`enableReset`/`enableReasoning` 为 `true`，`theme` 为 `'auto'`，`maxImageSize` 为 5 MB，`inputPlaceholder` 为 `''` | |
| `avatar.*` | `''` | |
| `cards`、`toolDisplayNames`、`welcome` | 空 | |

完整参考见随包分发的 Claude Code Skill：`.claude/skills/ai-chat-integration/references/config-reference.md`。

### 语言

组件默认中文（`zh`），回退语言为 `en`。两种语言包都已导出，因此你可以自行创建 i18n 实例来指定语言 —— `ChatApp` 检测到已安装就会沿用，不会覆盖：

```ts
// main.ts
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { en, zh } from 'aix-chat'
import 'aix-chat/style.css'
import App from './App.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'zh',
  messages: { en, zh }
})

createApp(App).use(i18n).mount('#app')
```

把你自己的文案合并进 `{ en, zh }`，即可翻译或扩充界面文字。

### 主题与样式

`theme="auto"` 跟随系统；可用 `theme="light"` / `theme="dark"` 强制指定（或通过 `defineChatConfig` 的 `ui.theme`）。配色是一组作用域在 `:root.chat-theme` 上的 CSS 变量：

```ts
import 'aix-chat/styles/theme.css'   // 定义 --primary-color、--bg-page、--text-primary 等
```

在引入之后重新定义这些变量即可换肤：

```css
:root.chat-theme {
  --primary-color: #7c3aed;
  --bg-page: #faf9ff;
}
```

构建自定义工具卡片所需的 SCSS mixin 也已随包提供：

```scss
@use 'aix-chat/styles/chat-card';    // card-base、card-header、card-content、btn-base 等
```

## 自定义工具与卡片

用 `defineTools()` 定义工具；模型调用某个工具时，对应的 Vue 组件会直接渲染在聊天流里：

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

通过 `:tools="tools"` 传入。返回 `{ pending: true }` 的工具会等待用户交互，随后由 `onEvent`（或默认处理器）resolve。工具与卡片的完整文档见 [packages/chat-ui/README.zh-CN.md](./packages/chat-ui/README.zh-CN.md) —— 那里的 props 表是权威参考。

## 后端接口

组件只与一个端点通信：后端收到消息和前端传去的工具定义，调用大模型，再把回答流式返回。

| 方法 | 路径 | 用途 |
|------|------|------|
| `POST` | `/api/agent/chat` | 聊天与工具调用，SSE 流（`<ChatApp>` 唯一需要的端点） |
| `GET` | `/api/agent/conversations` | 当前用户的会话列表 |
| `GET` | `/api/agent/conversations/:conversationId/messages` | 某个会话的消息 |
| `DELETE` | `/api/agent/conversations/:conversationId` | 删除会话 |
| `GET` | `/health` | 健康检查 |

自带的服务端通过 `x-user-id` 请求头识别用户（缺省为 `default-user`），且**没有任何鉴权** —— 对外暴露前请自行补充。

### 请求格式

```json
{
  "agentId": "my-agent",
  "messages": [{ "role": "user", "content": "你好" }],
  "tools": [
    { "name": "showOptions", "description": "...", "parameters": { } }
  ],
  "systemPrompt": "你是一个助手..."
}
```

### 响应格式

[AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) 格式的 SSE 流，由 `toUIMessageStream()` 生成。

### 最小参考实现

```ts
// POST /api/agent/chat
import { streamText, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const model = createOpenAICompatible({
  name: 'Qwen',
  apiKey: process.env.DASHSCOPE_API_KEY ?? '',
  baseURL: process.env.OPENAI_API_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

export async function POST(req: Request) {
  const { messages, tools = [], systemPrompt } = await req.json()

  const aiTools = Object.fromEntries(
    tools.map((t: any) => [t.name, { description: t.description, parameters: t.parameters ?? {} }])
  )

  const result = streamText({
    model: model(process.env.TEXT_MODEL ?? 'qwen3.6-plus'),
    instructions: systemPrompt,
    messages: messages.map((m: any) => ({
      role: m.role,
      content: m.content || m.parts?.map((p: any) => p.text).filter(Boolean).join('') || ''
    })),
    tools: aiTools
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, sendReasoning: true })
  })
}
```

任何 AI SDK 供应商都适用 —— 换掉客户端即可，流的格式不变。带数据库落库的完整实现见 `packages/chat-ui` 内的 `.claude/skills/ai-chat-integration/references/backend-api-guide.md`。

## 常见问题

**`SyntaxError: Need to install with app.use function`** —— 你用的是 `aix-chat` ≤ 1.0.3，该版本需要手动配置 i18n。升级到 ≥ 1.0.4（`npm install aix-chat@latest`）即可；若要继续用旧版本，按[语言](#语言)一节手动包裹应用。

**`Cannot find module 'aix-chat/dist/i18n/en.json'`** —— 同一个原因，同样的解法：该路径在 1.0.4 之前被写进文档但从未随包发布，请改为从包根导入 `en`/`zh`。

**聊天回复 "AI service error"** —— 基本都是缺 `DASHSCOPE_API_KEY`。服务端现在会在启动时告警；确认 `.env` 位于**仓库根目录**（不是 `packages/server/`）且填了真实的 Key。

**`❌ Database connection failed` 且服务端退出** —— PostgreSQL 没跑起来。执行 `docker compose up -d`，再用 `docker compose ps` 确认。若用的是自己的数据库，检查 `DATABASE_URL`。

**表不存在 / 改了表结构却不生效** —— `init.sql` 只在数据卷全新时执行。用 `docker compose down -v && docker compose up -d` 重建，或手动执行 `init.sql`。

**语音按钮报错** —— 演示中属预期行为：后端没有实现 `POST /api/stt/open`。见[语音输入需要一个语音识别接口](#语音输入需要一个语音识别接口)。

**请求被 CORS 拦截** —— 服务端会回显请求来源（`origin: true`），浏览器报错通常意味着来源不匹配或代理丢掉了请求头。最省事的办法是像演示那样，把 `api-base` 指向后端的绝对地址。

**`EADDRINUSE`** —— 3000（或 5173）端口被占用。改 `PORT`，或改演示的 `server.port`。

## 开发

| 命令 | 作用 |
|------|------|
| `pnpm install` | 安装并链接所有 workspace 包 |
| `pnpm dev` | 运行所有包的 dev 脚本（组件库 watch 构建、演示、后端） |
| `pnpm dev:server` | 只启动后端，watch 模式（tsx） |
| `pnpm dev:ui` | 只启动演示（Vite，端口 5173） |
| `pnpm build` | 构建所有包 |
| `pnpm build:ui` | 构建组件库（`vite build` + 类型声明） |
| `pnpm build:demo` | 构建演示应用 |
| `pnpm build:server` | 用 `tsc` 编译后端 |
| `pnpm --filter aix-chat type-check` | 组件库类型检查（`vue-tsc`） |

## Claude Code Skills

`packages/chat-ui` 随包提供一个 Claude Code Skill，可以引导你把聊天组件接入 Vue 3 项目 —— 卡片、工具、后端对接都有覆盖。

安装时会执行 `postinstall` 脚本，把 skills 链接到项目的 `.claude/skills` 目录，但仅当该目录已存在（即你确实在用 Claude Code）时才执行。设置 `SKIP_AIX_SKILLS=1` 可关闭。手动链接：

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

然后直接问：*「帮我加一个 AI 聊天气泡卡片」*、*「如何创建一个聊天工具？」*、*「接入后端 Agent API」*。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite 6（演示）/ Vite 8（组件库构建）
- **聊天运行时**：AI SDK v7（`ai` + `@ai-sdk/vue`，`useChat` 风格的流式输出）
- **后端**：Fastify 5 + AI SDK，经 `postgres` 访问 PostgreSQL 16
- **默认模型**：通过 `@ai-sdk/openai-compatible` 调用 DashScope `qwen3.6-plus`，可换成任意 AI SDK 供应商
- **Monorepo**：pnpm workspaces

## License

MIT