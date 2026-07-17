<script setup lang="ts">
import { ref, watch } from 'vue'
import { createChat } from './tools/createChat'
import type { ToolConfig, CreateChatOptions } from './tools/createChat'
import ChatMessageList from './components/ChatMessageList.vue'
import ChatInput from './components/ChatInput.vue'
import AiChatProvider from './provider/AiChatProvider.vue'
import { defineChatConfig } from './config/defineChatConfig'

const props = defineProps<{
  agentId: string
  tools?: ToolConfig[] | { tools: ToolConfig[]; [key: string]: any }
  systemPrompt?: string
  headers?: Record<string, string> | (() => Record<string, string>)
  welcome?: {
    text: string
    quickReplies?: Array<{ label: string; value: string }>
  }
}>()

// 支持两种格式：直接数组或 defineTools 返回的对象
const toolsArray = Array.isArray(props.tools)
  ? props.tools
  : (props.tools as any)?.tools || []

// 创建 chat 实例
const chatOptions: CreateChatOptions = {
  agentId: props.agentId,
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

    // 如果有 execute 函数，执行它
    if (tool.execute) {
      try {
        const result = await tool.execute(args)
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
        ...(tool.mapProps ? tool.mapProps(args) : args),
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
