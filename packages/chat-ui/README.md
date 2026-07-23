# aix-chat

Drop-in Vue 3 AI chat component. Streaming responses, custom cards, voice input, image upload, light/dark theme.

[中文文档](./README.zh-CN.md)

## Install

```bash
npm install aix-chat
```

## Quick Start

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import 'aix-chat/style.css'
</script>

<template>
  <ChatApp agent-id="my-agent" api-base="http://localhost:3000" />
</template>
```

That's it — three lines and you have a full chat UI.

## Full Example

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

## Props

#### Required

| Prop | Type | Description |
|------|------|-------------|
| `agent-id` | `string` | Agent identifier |

#### API Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `api-base` | `string` | `''` | API base URL |
| `api-endpoint` | `string` | `'/api/agent/chat'` | API endpoint path |
| `headers` | `Record<string, string> \| () => Record<string, string>` | `{}` | Request headers (supports function, called per request) |

#### Appearance

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `assistant-name` | `string` | `''` | Assistant display name |
| `assistant-avatar` | `string` | `''` | Assistant avatar URL |
| `user-name` | `string` | `''` | User display name |
| `user-avatar` | `string` | `''` | User avatar URL |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme |
| `show-header` | `boolean` | `true` | Show header bar |
| `input-placeholder` | `string` | `''` | Input placeholder text |

#### Feature Toggles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enable-voice` | `boolean` | `true` | Voice input |
| `enable-image-upload` | `boolean` | `true` | Image upload |
| `enable-reset` | `boolean` | `true` | Reset conversation button |
| `enable-reasoning` | `boolean` | `true` | Show thinking process |
| `max-image-size` | `number` | `5242880` | Max image size in bytes |

#### Content & Tools

| Prop | Type | Description |
|------|------|-------------|
| `system-prompt` | `string` | System prompt |
| `welcome` | `{ text: string, quickReplies?: Array<{ label: string, value: string }> }` | Welcome message |
| `tools` | `ToolConfig[] \| defineTools()` | Tool definitions (see below) |

## Custom Tools & Cards

Use `defineTools()` to define tools — when the AI invokes a tool, your Vue card component renders automatically.

```ts
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

Pass `:tools="tools"` to `<ChatApp>`. When the AI calls the tool, `OptionCard` renders inline in the chat bubble.

## Alternative Usage

### `mountChat()` — One-liner mount (no Vue SFC needed)

```ts
import { mountChat } from 'aix-chat'
import 'aix-chat/style.css'

const { unmount } = mountChat('#app', {
  agentId: 'my-agent',
  apiBase: 'http://localhost:3000'
})
```

Great for quick prototypes, non-Vue projects, or embedding into existing pages.

### `createChat()` — Full custom UI

Build your own UI, just use the chat logic:

```ts
import { createChat } from 'aix-chat'

const { chat, sendMessage, chatBusy, pendingToolCall, resolve } = createChat({
  agentId: 'my-agent',
  apiBase: 'http://localhost:3000',
  tools: tools.schemas,
  onToolCall: async (name, args) => { /* handle tool calls yourself */ }
})

await sendMessage({ text: 'Hello' })
```

## Style Customization

```scss
// Import card style mixins
@use 'aix-chat/styles/chat-card';
```

More source styles available via `./styles/*`:

```ts
import 'aix-chat/styles/variables'
```

## Claude Code Skills

After installation, Claude Code Skills are automatically linked to your project's `.claude/skills` directory.

**Don't know how to code? No problem.** Just ask in Claude Code:

- "Add a new AI chat card for me"
- "How do I create a chat tool?"
- "Connect to the backend Agent API"

Claude will auto-load the `ai-chat-integration` skill and guide you through it step by step.

If auto-linking fails, do it manually:

```bash
mkdir -p .claude
cp -r node_modules/aix-chat/.claude/skills .claude/
```

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

SSE stream in [AI SDK UI Message Stream](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/stream-protocol#ui-message-stream) format. Use `streamText()` + `toUIMessageStream()` from the `ai` package.

### Minimal Reference Implementation (Vercel AI SDK)

```ts
// POST /api/agent/chat
import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { messages, tools = [], systemPrompt } = await req.json()

  // Convert tool definitions to AI SDK format
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

Works with any AI provider supported by the AI SDK — OpenAI, Anthropic, Google, DashScope, Ollama, etc. Just swap the provider.

See `references/backend-api-guide.md` in the bundled Claude Code Skills for a full implementation with database persistence.

## Tech Stack

- Vue 3 + TypeScript
- AI SDK v7 (`ai` + `@ai-sdk/vue`)
- Pinia state management

## License

MIT
