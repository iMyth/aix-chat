<script setup lang="ts">
import { ref, watch } from 'vue'
import { createChat } from './tools/createChat'
import type { ToolConfig, CreateChatOptions } from './tools/createChat'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import AiChatProvider from './provider/AiChatProvider.vue'
import { defineChatConfig } from './config/defineChatConfig'
import type { ChatAppProps } from './ChatApp.types'

const props = defineProps<ChatAppProps>()

// 默认值
const apiBase = props.apiBase ?? ''
const apiEndpoint = props.apiEndpoint ?? '/api/agent/chat'
const showHeader = props.showHeader ?? true
const showEmptyState = props.showEmptyState ?? true
const enableVoice = props.enableVoice ?? true
const enableImageUpload = props.enableImageUpload ?? true
const enableReset = props.enableReset ?? true
const enableReasoning = props.enableReasoning ?? true
const maxImageSize = props.maxImageSize ?? 5 * 1024 * 1024
const theme = props.theme ?? 'auto'

// 支持两种格式：直接数组或 defineTools 返回的对象
const toolsArray = Array.isArray(props.tools)
  ? props.tools
  : (props.tools as any)?.tools || []

// 创建 chat 实例
const chatOptions: CreateChatOptions = {
  agentId: props.agentId,
  apiBase,
  apiEndpoint,
  systemPrompt: props.systemPrompt,
  headers: props.headers,
  tools: toolsArray.map((t: ToolConfig) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  })),
  onToolCall: async (toolName, args) => {
    const tool = toolsArray.find((t: ToolConfig) => t.name === toolName)
    if (!tool) {
      console.warn(`Tool not found: ${toolName}`)
      return { error: `Tool not found: ${toolName}` }
    }

    // 解析 args 中的 JSON 字符串字段（AI 模型有时会返回字符串而不是对象/数组）
    const parsedArgs = { ...args }
    for (const key in parsedArgs) {
      const value = parsedArgs[key]
      if (typeof value === 'string') {
        // 尝试解析看起来像 JSON 的字符串
        if ((value.startsWith('[') && value.endsWith(']')) ||
            (value.startsWith('{') && value.endsWith('}'))) {
          try {
            parsedArgs[key] = JSON.parse(value)
          } catch (e) {
            // 解析失败，保持原值
          }
        }
      }
    }

    // 如果有 execute 函数，执行它
    if (tool.execute) {
      try {
        const result = await tool.execute(parsedArgs)
        // 如果结果包含 pending: true，返回给 UI 等待交互
        if (result?.pending) {
          return result
        }
        // 否则直接返回结果
        return result
      } catch (error) {
        console.error(`Tool execution error: ${toolName}`, error)
        return { error: error instanceof Error ? error.message : 'Execution failed' }
      }
    }

    // 如果没有 execute 但有 component，返回 pending 状态
    if (tool.component) {
      return {
        pending: true,
        type: tool.name,
        ...(tool.mapProps ? tool.mapProps(parsedArgs) : parsedArgs),
      }
    }

    return { error: 'No execute function or component defined' }
  },
}

const {
  chat,
  pendingToolCall,
  setPending,
  resolve,
  sendMessage,
  quickReply,
  resetChat,
  isProcessing,
} = createChat(chatOptions)

// 创建 chatConfig（用于 AiChatProvider）
const chatConfig = defineChatConfig({
  cards: {
    pending: Object.fromEntries(
      toolsArray.filter((t: ToolConfig) => t.component).map((t: ToolConfig) => [t.name, t.component!])
    ),
    completed: {},
  },
  transport: {
    api: `${apiBase}${apiEndpoint}`,
    headers: typeof props.headers === 'function' ? props.headers() : props.headers,
  },
  voice: {
    enabled: enableVoice,
    sender: props.sender,
  },
  ui: {
    showHeader,
    showEmptyState,
    maxImageSize,
    theme,
    inputPlaceholder: props.inputPlaceholder,
    enableImageUpload,
    enableReset,
    enableReasoning,
  },
  avatar: {
    assistantName: props.assistantName,
    assistantAvatar: props.assistantAvatar,
    userName: props.userName,
    userAvatar: props.userAvatar,
    sender: props.sender,
  },
  welcome: props.welcome,
})

// 卡片事件处理
function handleCardEvent({ eventName, data }: { eventName: string; cardType: string; data: any }) {
  const toolName = pendingToolCall.value?.toolCall?.toolName
  const tool = toolsArray.find((t: ToolConfig) => t.name === toolName)

  // 调用工具的 onEvent 回调
  if (tool?.onEvent) {
    tool.onEvent(eventName, data)
  }

  // 默认行为：resolve 工具调用
  resolve({ eventName, data })
}

// 发送消息
function handleSend(content: { text: string; files: FileList | null }) {
  sendMessage(content)
}

// 重置聊天
function handleReset() {
  resetChat()
}

// 监听消息变化，注入欢迎消息
watch(() => chat.messages.length, (len) => {
  if (len === 0 && props.welcome?.text) {
    chat.messages = [{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      parts: [{ type: 'text', text: props.welcome.text }],
      data: { quickReplies: props.welcome.quickReplies },
    } as any]
  }
}, { immediate: true })
</script>

<template>
  <AiChatProvider :config="chatConfig">
    <div class="aix-chat-container">
      <ChatMessageList
        :messages="chat.messages"
        :is-loading="isProcessing"
        :pending-tool-call="pendingToolCall"
        @card-event="handleCardEvent"
        @quick-reply="quickReply"
      />
      <ChatInput
        :pending-tool-call="Boolean(pendingToolCall)"
        :disabled="isProcessing"
        @send="handleSend"
        @reset="handleReset"
      />
    </div>
  </AiChatProvider>
</template>

<style scoped>
.aix-chat-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-page, #f5f5f5);
}
</style>
