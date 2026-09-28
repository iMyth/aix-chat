# AIX Chat

A Vue 3 AI chat component library, plus a runnable order-assistant demo and the backend that powers it.

[中文文档](./README.zh-CN.md)

## What's in this repo

| Path | Package | What it is | Runs on |
|------|---------|------------|---------|
| `packages/chat-ui` | `aix-chat` | The component library — streaming chat UI, custom tool cards, voice & image input, light/dark theme | published to npm |
| `packages/demo` | `aix-chat-demo` | Order-assistant demo app (Vite + Vue 3) | http://localhost:5173 |
| `packages/server` | `aix-chat-server` | Backend — SSE chat endpoint, tool passthrough, PostgreSQL conversation history | http://localhost:3000 |

Only `packages/chat-ui` is published. The demo and server are a reference implementation: copy what you need, or replace the server with your own (see [Backend API](#backend-api)).

## Requirements

| Requirement | Why |
|-------------|-----|
| **Node.js ≥ 20.19** | `packages/chat-ui` builds with Vite 8 (`^20.19 \|\| >=22.12`). Developed on Node 24. |
| **pnpm ≥ 9** | This repo is a pnpm workspace (`pnpm-workspace.yaml`). npm and yarn cannot resolve the `workspace:*` links. Developed with pnpm 11.4. |
| **Docker** | Runs the PostgreSQL container. Skip it if you point `DATABASE_URL` at an existing PostgreSQL 16 instead. |

## Quick Start

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Create your env file — the backend reads it at startup
cp .env.example .env
#    → then edit .env and set DASHSCOPE_API_KEY

# 3. Start PostgreSQL
docker compose up -d                 # older Docker CLI: docker-compose up -d
docker compose ps                    # wait until the container is "healthy"

# 4. Start the backend (port 3000)
pnpm dev:server
#    → ✅ Database connected successfully
#    → 🚀 Server running on http://localhost:3000

# 5. Start the demo in a second terminal (port 5173)
pnpm dev:ui
```

Open http://localhost:5173 and send a message. Check the backend on its own with:

```bash
curl -s localhost:3000/health        # {"status":"ok","timestamp":"..."}
```

`pnpm dev` runs every package's dev script at once — the library's watch build, the demo, and the backend — so the logs interleave. Separate terminals are easier to debug.

## Configuration

Everything is configured by two `.env` files. Nothing needs to be edited in source to run the demo.

### Which file configures what

| File | Read by | Holds |
|------|---------|-------|
| `.env` (repo root) | the backend, via `packages/server/src/env.ts` | API key, model, `DATABASE_URL`, `PORT` |
| `packages/demo/.env` | the demo app (Vite) | `VITE_*` client variables |

They are deliberately separate: Vite only loads `.env` files that sit inside the app it builds, and it only exposes `VITE_`-prefixed variables to the browser. **Never put the API key in a `VITE_` variable** — anything with that prefix ends up in the client bundle.

The server resolves the root `.env` from the file's own location rather than the working directory, so it is picked up the same way by `pnpm dev:server`, `tsx src/server.ts`, or `node dist/server.js` run from anywhere.

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DASHSCOPE_API_KEY` | **yes** | — | Key for the OpenAI-compatible provider. If empty, the server starts but every chat request fails (it warns at startup). The name is a leftover — it holds the key for whichever provider you configure. |
| `OPENAI_API_URL` | no | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Base URL of the OpenAI-compatible API. |
| `TEXT_MODEL` | no | `qwen3.6-plus` | Model name passed to the provider. |
| `DATABASE_URL` | no | `postgresql://aix:aix123@localhost:5432/aix_chat` | PostgreSQL connection string; the default matches `docker-compose.yml`. |
| `PORT` | no | `3000` | Backend HTTP port. |
| `VITE_API_KEY` | no | — | **Demo frontend only**, set in `packages/demo/.env`. Sent as the `x-api-key` request header; the bundled server does not verify it. |

### Switching model or provider

`packages/server/src/routes/agent-chat.ts:10` creates the client with `createOpenAICompatible`, so any OpenAI-compatible endpoint works — set the three variables below and restart the server:

| Provider | `.env` |
|----------|--------|
| DashScope / Qwen (default) | `OPENAI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1` · `TEXT_MODEL=qwen3.6-plus` |
| OpenAI | `OPENAI_API_URL=https://api.openai.com/v1` · `TEXT_MODEL=gpt-4o-mini` |
| Ollama (local) | `OPENAI_API_URL=http://localhost:11434/v1` · `TEXT_MODEL=llama3.1` (any non-empty key) |
| vLLM / OpenRouter / other gateway | Point `OPENAI_API_URL` at it; the same three variables cover it |

For a provider with its own SDK instead of an OpenAI-compatible API, swap `createOpenAICompatible` for that provider's factory (e.g. `createAnthropic` from `@ai-sdk/anthropic`, added to `packages/server`).

### Database

`docker-compose.yml` runs PostgreSQL 16 as `aix-postgres` with user `aix`, password `aix123`, database `aix_chat`, port `5432`, and the named volume `postgres_data`.

`init.sql` runs **only when the volume is created for the first time**. It creates:

- `conversations` — `id`, `agent_id`, `user_id`, `created_at`, `updated_at`
- `messages` — `id`, `conversation_id`, `role`, `content`, `tool_calls` (jsonb), `tool_call_id`, `created_at`
- Indexes on `agent_id`, `user_id`, `conversation_id`, `created_at`

```bash
docker compose up -d        # start
docker compose logs -f postgres
docker compose down         # stop, keep data
docker compose down -v      # stop and wipe the volume (init.sql runs again next start)
```

The server tests the connection at boot and **exits with code 1** if PostgreSQL is unreachable — a stopped database is a hard failure, not a degraded mode. If you change `DATABASE_URL`, stop the container first, and note that schema changes require `docker compose down -v` or running `init.sql` by hand (the init script does not re-run on an existing volume).

### Ports

| Port | Used by | How to change |
|------|---------|---------------|
| `3000` | backend | `PORT` in `.env` |
| `5173` | demo dev server | `server.port` in `packages/demo/vite.config.ts` |
| `5432` | PostgreSQL container | `ports` in `docker-compose.yml` (update `DATABASE_URL` to match) |

### Voice input needs a speech-to-text endpoint

Voice input records audio and uploads it — there is no on-device transcription:

```
POST <sttEndpoint>          default: /api/stt/open  (relative to the page origin)
Content-Type: application/json
{ "base64": "data:audio/webm;base64,...", "sender": "<user id>" }

→ { "text": "transcribed text" }
```

**The bundled server does not implement this route**, so the microphone button in the demo reports an error. To make voice work, add `POST /api/stt/open` to your backend (in the demo, Vite's `/api` proxy already forwards it to port 3000).

Note that `<ChatApp>` has no prop for this URL: it always uses the default `/api/stt/open`, because `ChatApp` builds its internal config without an `sttEndpoint`. If you need a different path today, use the lower-level `defineChatConfig()` + `AiChatProvider` composition described in [packages/chat-ui/README.md](./packages/chat-ui/README.md).

### How the demo reaches the backend

`packages/demo/src/App.vue` sets `api-base="http://localhost:3000"`, so the browser calls the backend **cross-origin** and the server's CORS headers (`origin: true`, credentials allowed) are what make it work. `packages/demo/vite.config.ts` also defines an `/api` proxy to port 3000, which is the alternative if you prefer same-origin requests — in that case leave `api-base` empty and keep `api-endpoint="/api/agent/chat"`.

## Using the component library

### Install

```bash
npm install aix-chat
```

`aix-chat` needs these peer dependencies. npm (≥ 7) and pnpm (≥ 8) install peer dependencies automatically, yarn does not — install them explicitly if you hit a peer warning or want to pin the versions yourself:

| Peer | Version |
|------|---------|
| `vue` | `^3.5.0` |
| `ai` | `^7.0.0` |
| `@ai-sdk/vue` | `^4.0.0` |

```bash
pnpm add aix-chat ai@^7 @ai-sdk/vue@^4
```

**i18n needs no setup.** Since v1.0.4 `vue-i18n` ships as a regular dependency and the components fall back to built-in `en`/`zh` locales, so you never have to call `app.use(i18n)` yourself. Older versions (≤ 1.0.3) threw `SyntaxError: Need to install with app.use function` — see [Troubleshooting](#troubleshooting).

### Minimal usage

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
</script>

<template>
  <ChatApp agent-id="my-agent" api-base="http://localhost:3000" />
</template>
```

### Full example

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
    assistant-name="Order Assistant"
    assistant-avatar="/ai-avatar.png"
    user-name="Alice"
    :tools="tools"
    system-prompt="You are a professional order assistant."
    :welcome="{
      text: 'Hi! How can I help you?',
      quickReplies: [
        { label: 'Place Order', value: 'I want to place a new order' },
        { label: 'Check Order', value: 'Check my recent orders' }
      ]
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    input-placeholder="Type your question..."
  />
</template>
```

### ChatApp props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agent-id` | `string` | — | **Required.** Agent identifier recorded with each conversation. |
| `api-base` | `string` | `''` | Backend origin, e.g. `http://localhost:3000`. Empty means same-origin. |
| `api-endpoint` | `string` | `'/api/agent/chat'` | Path appended to `api-base`. |
| `headers` | `Record<string, string> \| () => Record<string, string>` | `undefined` | Request headers. Pass a function to resolve a token per request. |
| `assistant-name` / `assistant-avatar` | `string` | `''` | Assistant label and avatar URL. |
| `user-name` / `user-avatar` | `string` | `''` | User label and avatar URL. |
| `sender` | `string` | `''` | User identifier, forwarded to STT requests. |
| `system-prompt` | `string` | `undefined` | System prompt sent with every request. |
| `welcome` | `{ text: string, quickReplies?: { label: string, value: string }[] }` | `undefined` | Injected as the first assistant message, including quick-reply chips. |
| `tools` | `ToolConfig[] \| defineTools()` | `undefined` | Tool definitions; see below. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Colour theme; `auto` follows the OS. |
| `show-header` | `boolean` | `true` | Show the header bar. |
| `show-empty-state` | `boolean` | `true` | Show the empty state before the first message. |
| `input-placeholder` | `string` | `''` | Input placeholder text. |
| `enable-voice` | `boolean` | `true` | Voice input (needs a backend STT route, see above). |
| `enable-image-upload` | `boolean` | `true` | Image upload and paste. |
| `enable-reset` | `boolean` | `true` | Reset-conversation button. |
| `enable-reasoning` | `boolean` | `true` | Show the model's thinking output. |
| `max-image-size` | `number` | `5242880` | Max image size in bytes (5 MB). |

### defineChatConfig

`<ChatApp>` is a thin wrapper: it turns its props into a config object with `defineChatConfig()` and renders `<AiChatProvider>`. Use it directly when you compose your own UI, or when you need a setting `<ChatApp>` does not expose:

```ts
import { defineChatConfig } from 'aix-chat'

const config = defineChatConfig({
  transport: { api: '/api/chat', headers: { 'x-api-key': '...' } },
  voice: { enabled: true, sttEndpoint: '/my/stt', sender: 'user-1' },
  ui: { theme: 'light', inputPlaceholder: 'Ask me anything...' },
  avatar: { assistantName: 'Assistant', userName: 'Alice' },
  cards: { pending: { showOptions: OptionCard }, completed: {} },
  toolDisplayNames: { showOptions: 'tool.showOptions' },
  welcome: { text: 'Hi!', quickReplies: [{ label: 'Help', value: 'help' }] }
})
```

Defaults differ from the prop defaults, which is a common source of confusion:

| Key | Default | Note |
|-----|---------|------|
| `transport.api` | `'/api/chat'` | **Not** `/api/agent/chat` — set it yourself. |
| `transport.headers` | `{}` | |
| `transport.buildBody` | `({ context, sender }) => ({ context, sender })` | Override to shape your request payload. |
| `voice.enabled` | `true` | |
| `voice.sttEndpoint` | `'/api/stt/open'` | |
| `voice.sender` | `''` | |
| `ui.*` | same as the props: `showHeader`/`showEmptyState`/`enableImageUpload`/`enableReset`/`enableReasoning` `true`, `theme` `'auto'`, `maxImageSize` 5 MB, `inputPlaceholder` `''` | |
| `avatar.*` | `''` | |
| `cards`, `toolDisplayNames`, `welcome` | empty | |

The full reference lives with the bundled Claude Code Skill at `.claude/skills/ai-chat-integration/references/config-reference.md`.

### Language

Components default to Chinese (`zh`) with `en` as fallback. Both locale objects are exported, so you can install your own i18n instance and pick a locale — `ChatApp` detects it and leaves it alone:

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

Merge your own messages into `{ en, zh }` to translate or extend the UI strings.

### Theme and styles

`theme="auto"` follows the OS preference; force it with `theme="light"` or `theme="dark"` (or via `defineChatConfig`'s `ui.theme`). The palette is a set of CSS custom properties scoped to `:root.chat-theme`:

```ts
import 'aix-chat/styles/theme.css'   // defines --primary-color, --bg-page, --text-primary, …
```

Redefine them anywhere after the import to restyle the UI:

```css
:root.chat-theme {
  --primary-color: #7c3aed;
  --bg-page: #faf9ff;
}
```

SCSS mixins for building your own tool cards are shipped too:

```scss
@use 'aix-chat/styles/chat-card';    // card-base, card-header, card-content, btn-base, …
```

## Custom tools and cards

Define tools with `defineTools()`; when the model calls one, the matching Vue component renders inline in the chat:

```ts
import { defineTools } from 'aix-chat'
import OptionCard from './OptionCard.vue'

export const tools = defineTools([
  {
    name: 'showOptions',
    description: 'Show options for the user to choose from',
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

Pass it as `:tools="tools"`. A tool that returns `{ pending: true }` waits for user interaction, which `onEvent` (or the default handler) then resolves. See [packages/chat-ui/README.md](./packages/chat-ui/README.md) for the full tool and card docs — the prop tables there are the reference of record.

## Backend API

The component talks to one endpoint. Your backend receives the messages plus the frontend's tool definitions, calls an LLM, and streams the answer back.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/agent/chat` | Chat + tool calls; SSE stream (the only endpoint `<ChatApp>` needs) |
| `GET` | `/api/agent/conversations` | Conversations for the current user |
| `GET` | `/api/agent/conversations/:conversationId/messages` | Messages of one conversation |
| `DELETE` | `/api/agent/conversations/:conversationId` | Delete a conversation |
| `GET` | `/health` | Liveness check |

The bundled server identifies the user by the `x-user-id` header (falling back to `default-user`) and performs **no authentication** — add your own before exposing it.

### Request

```json
{
  "agentId": "my-agent",
  "messages": [{ "role": "user", "content": "Hello" }],
  "tools": [
    { "name": "showOptions", "description": "...", "parameters": { } }
  ],
  "systemPrompt": "You are an assistant..."
}
```

### Response

An SSE stream in [AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) format, produced by `toUIMessageStream()`.

### Minimal reference implementation

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

Any AI SDK provider works — swap the client, keep the stream shape. For a full implementation with database persistence, see `.claude/skills/ai-chat-integration/references/backend-api-guide.md` in `packages/chat-ui`.

## Troubleshooting

**`SyntaxError: Need to install with app.use function`** — you are on `aix-chat` ≤ 1.0.3, which required manual i18n setup. Upgrade to ≥ 1.0.4 (`npm install aix-chat@latest`), or keep the old version and wrap your app as shown in [Language](#language).

**`Cannot find module 'aix-chat/dist/i18n/en.json'`** — same cause, same fix: that path was advertised before 1.0.4 and never shipped. Import `en`/`zh` from the package root instead.

**Chat replies with "AI service error"** — almost always a missing `DASHSCOPE_API_KEY`. The server now warns about it at startup; check that `.env` exists at the **repo root** (not `packages/server/`) and holds a real key.

**`❌ Database connection failed` and the server exits** — PostgreSQL is not running. Start it with `docker compose up -d` and confirm with `docker compose ps`. If you use your own database, check `DATABASE_URL`.

**Tables are missing / schema changes have no effect** — `init.sql` only runs on a fresh volume. Run `docker compose down -v && docker compose up -d` to recreate, or apply `init.sql` manually.

**Voice button fails** — expected in the demo: the backend does not implement `POST /api/stt/open`. See [Voice input](#voice-input-needs-a-speech-to-text-endpoint).

**Requests blocked by CORS** — the server reflects the request origin (`origin: true`), so a browser error usually means an origin mismatch or a proxy stripping headers. Simplest fix: set `api-base` to the backend's absolute URL, as the demo does.

**`EADDRINUSE`** — port 3000 (or 5173) is taken. Change `PORT`, or the demo's `server.port`.

## Development

| Command | Does |
|---------|------|
| `pnpm install` | Install and link all workspace packages |
| `pnpm dev` | Run every package's dev script (library watch build, demo, backend) |
| `pnpm dev:server` | Backend only, watch mode (tsx) |
| `pnpm dev:ui` | Demo only (Vite, port 5173) |
| `pnpm build` | Build every package |
| `pnpm build:ui` | Build the library (`vite build` + type declarations) |
| `pnpm build:demo` | Build the demo app |
| `pnpm build:server` | Compile the backend with `tsc` |
| `pnpm --filter aix-chat type-check` | Type-check the library (`vue-tsc`) |

## Claude Code Skills

`packages/chat-ui` ships a Claude Code Skill that walks you through integrating the chat into a Vue 3 project — cards, tools, and backend wiring.

On install, a `postinstall` script links the skills into your project's `.claude/skills` directory, but only if that directory already exists (i.e. you use Claude Code). Opt out with `SKIP_AIX_SKILLS=1`. To link manually:

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

Then just ask: *"Add a new AI chat card"*, *"How do I create a chat tool?"*, *"Connect to the backend Agent API"*.

## Tech stack

- **Frontend**: Vue 3 + TypeScript + Vite 6 (demo) / Vite 8 (library build)
- **Chat runtime**: AI SDK v7 (`ai` + `@ai-sdk/vue`, `useChat`-style streaming)
- **Backend**: Fastify 5 + AI SDK, PostgreSQL 16 via `postgres`
- **Default model**: DashScope `qwen3.6-plus` through `@ai-sdk/openai-compatible` — swap for any AI SDK provider
- **Monorepo**: pnpm workspaces

## License

MIT