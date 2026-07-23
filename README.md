# AIX Chat

A concise AI chat component library and demo project. Provides an out-of-the-box Vue 3 chat interface with custom tools, card components, streaming responses, and more.

[中文文档](./README.zh-CN.md)

## Project Structure

```
aix-chat/
├── packages/
│   ├── chat-ui/       # AI chat component library (npm: aix-chat)
│   ├── demo/          # Order assistant demo
│   └── server/        # Backend API (simplified)
├── package.json       # Monorepo config
└── pnpm-workspace.yaml
```

## Quick Start

### 1. Install dependencies

```bash
cd aix-chat
pnpm install
```

### 2. Start the database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Verify
docker-compose ps
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your OpenAI API Key
```

### 4. Run the app

```bash
# Start backend (port 3000)
pnpm dev:server

# Start frontend (port 5173)
pnpm dev:ui
```

Visit http://localhost:5173

## Core Features

### Frontend (aix-chat)

- **ChatApp component**: Full chat UI, ready to use out of the box
- **Tool definition**: Define tools and cards via `defineTools`
- **Automatic handling**: Card registration, event routing, pending state — all handled for you
- **Responsive design**: Mobile and desktop support
- **AI SDK v7**: Uses the latest `useChat` composable with streaming support

### Backend (aix-chat-server)

- **Minimal design**: Single `/api/agent/chat` endpoint
- **Streaming response**: SSE streaming output
- **Tool support**: Receives frontend tool definitions, passes them to AI
- **PostgreSQL storage**: Persists conversation history via Docker

### Database

The project uses Docker to run a PostgreSQL database for persisting chat history:

```bash
# Start database
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v
```

Database credentials:
- **Host**: localhost:5432
- **User**: aix
- **Password**: aix123
- **Database**: aix_chat
- **Connection String**: `postgresql://aix:aix123@localhost:5432/aix_chat`

## Usage

### Install the package

```bash
npm install aix-chat
```

### Basic usage

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

### Define tools

```typescript
import { defineTools } from 'aix-chat'
import OptionCard from './OptionCard.vue'

export const tools = defineTools([
  {
    name: 'showOptions',
    description: 'Show options for user to choose',
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

### Use ChatApp

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
    system-prompt="You are an assistant..."
    :welcome="{
      text: 'Hi! How can I help you?',
      quickReplies: [
        { label: 'Action A', value: 'Execute Action A' },
        { label: 'Action B', value: 'Execute Action B' }
      ]
    }"
  />
</template>
```

For full documentation on the chat component, see [packages/chat-ui/README.md](./packages/chat-ui/README.md).

## Backend Integration

The component talks to a single SSE endpoint (default: `POST /api/agent/chat`). Your backend receives messages + tool definitions, calls an LLM, and streams back responses.

### Request

```json
{
  "agentId": "my-agent",
  "messages": [{ "role": "user", "content": "Hello" }],
  "tools": [
    { "name": "showOptions", "description": "...", "parameters": { ... } }
  ],
  "systemPrompt": "You are an assistant..."
}
```

### Response

SSE stream in [AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) format.

### Minimal Reference Implementation

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

Works with any AI SDK provider — OpenAI, Anthropic, Google, DashScope, Ollama, etc.

For full component documentation, see [packages/chat-ui/README.md](./packages/chat-ui/README.md).

## Claude Code Skills

This project includes Claude Code Skills to help you integrate the AI chat quickly.

After installing `aix-chat`, the skills are automatically linked to your project's `.claude/skills` directory.

### Using Skills

In Claude Code, just ask:

- "How do I add an AI chat card?"
- "How to create a chat tool?"
- "How to connect to the backend Agent API?"
- "How to develop card components?"

Claude will automatically use the `ai-chat-integration` skill to guide you through development.

### Manual Setup

If auto-linking fails:

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

## Development

```bash
# Build all packages
pnpm build

# Build chat-ui only
pnpm build:ui

# Build server only
pnpm build:server

# Dev mode (watch)
pnpm dev:ui
```

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **AI SDK**: ai v7 + @ai-sdk/vue v4 (useChat composable)
- **Backend**: Fastify + AI SDK
- **AI**: OpenAI GPT-4
- **Monorepo**: pnpm workspaces

## License

MIT
