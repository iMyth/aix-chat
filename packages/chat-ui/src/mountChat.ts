import { createApp } from 'vue'
import ChatApp from './ChatApp.vue'
import type { ToolConfig } from './tools/createChat'
import { ensureI18n } from './i18n/setup'

export interface MountChatOptions {
  agentId: string
  tools?: ToolConfig[]
  systemPrompt?: string
  headers?: Record<string, string> | (() => Record<string, string>)
  welcome?: {
    text: string
    quickReplies?: Array<{ label: string; value: string }>
  }
}

/**
 * 一键挂载聊天应用到指定 DOM 元素
 *
 * @example
 * ```ts
 * import { mountChat } from '@aix/chat'
 *
 * mountChat('#app', {
 *   agentId: 'order-assistant',
 *   tools: myTools,
 *   systemPrompt: '你是订单助手...',
 * })
 * ```
 */
export function mountChat(
  selector: string | Element,
  options: MountChatOptions
) {
  const el = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector

  if (!el) {
    throw new Error(`Element not found: ${selector}`)
  }

  const app = createApp(ChatApp, options as any)
  ensureI18n(app)
  app.mount(el)

  return {
    app,
    unmount: () => app.unmount(),
  }
}
