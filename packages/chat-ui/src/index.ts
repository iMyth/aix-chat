// ─── Components ──────────────────────────────────────────────────────
export { default as ChatMessageList } from './components/ChatMessageList.vue'
export { default as ChatMessage } from './components/ChatMessage.vue'
export { default as ChatInput } from './components/ChatInput.vue'
export { default as ChatAvatar } from './components/ChatAvatar.vue'
export { default as ChatEmptyState } from './components/ChatEmptyState.vue'
export { default as MarkdownRenderer } from './components/MarkdownRenderer.vue'

// ─── Registry ────────────────────────────────────────────────────────
export { default as CardRenderer } from './registry/CardRenderer.vue'
export { createCardRegistry } from './registry/createCardRegistry'
export { useCardRegistry } from './registry/useCardRegistry'

// ─── Config ──────────────────────────────────────────────────────────
export { defineChatConfig } from './config/defineChatConfig'
export type {
  ChatConfig,
  ChatConfigInput,
  ChatTransportConfig,
  ChatVoiceConfig,
  ChatUIConfig,
} from './config/types'

// ─── Provider ────────────────────────────────────────────────────────
export { default as AiChatProvider } from './provider/AiChatProvider.vue'

// ─── Composables ─────────────────────────────────────────────────────
export { usePendingToolCall } from './composables/usePendingToolCall'
export { ImageStrippingTransport } from './composables/useImageStrippingTransport'
export { useImageAttachment } from './composables/useImageAttachment'
export { useVoiceRecorder } from './composables/useVoiceRecorder'
export { useChatMessage } from './composables/useChatMessage'
export { useAutoScroll } from './composables/useAutoScroll'

// ─── High-level API ──────────────────────────────────────────────────
export { default as ChatApp } from './ChatApp.vue'
export { mountChat, type MountChatOptions } from './mountChat'
export { defineTools, createChat } from './tools'
export type { ToolConfig, CreateChatOptions, ToolDefinition } from './tools'

// ─── i18n ────────────────────────────────────────────────────────────
export { default as en } from './i18n/en.json'
export { default as zh } from './i18n/zh.json'
