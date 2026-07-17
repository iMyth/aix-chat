import type { Component } from 'vue'

export interface ChatTransportConfig {
  /** AI chat API endpoint */
  api: string
  /** HTTP headers (e.g. auth keys) */
  headers?: Record<string, string>
  /** Build the request body — receives context + sender, returns body object */
  buildBody?: (params: { context: string; sender: string }) => Record<string, unknown>
}

export interface ChatVoiceConfig {
  /** Enable voice input (default: true) */
  enabled?: boolean
  /** STT API endpoint */
  sttEndpoint?: string
  /** Sender identifier for STT requests */
  sender?: string
}

export interface ChatUIConfig {
  /** Show chat header (default: true) */
  showHeader?: boolean
  /** Show empty state when no messages (default: true) */
  showEmptyState?: boolean
  /** Max image file size in bytes (default: 5MB) */
  maxImageSize?: number
}

export interface ChatConfigInput {
  /** Card component registrations */
  cards?: {
    pending?: Record<string, Component>
    completed?: Record<string, Component>
  }
  /** Tool display names (tool name → i18n key) */
  toolDisplayNames?: Record<string, string>
  /** Transport configuration */
  transport?: Partial<ChatTransportConfig>
  /** Voice input configuration */
  voice?: Partial<ChatVoiceConfig>
  /** UI options */
  ui?: Partial<ChatUIConfig>
  /** Welcome message injector — called on mount and reset */
  welcome?: {
    text: string
    quickReplies?: Array<{ label: string; value: string }>
  }
}

export interface ChatConfig {
  cards: {
    pending: Record<string, Component>
    completed: Record<string, Component>
  }
  toolDisplayNames: Record<string, string>
  transport: ChatTransportConfig
  voice: Required<ChatVoiceConfig>
  ui: Required<ChatUIConfig>
  welcome?: ChatConfigInput['welcome']
}
