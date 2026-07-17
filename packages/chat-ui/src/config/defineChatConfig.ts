import type { ChatConfig, ChatConfigInput } from './types'

/**
 * Factory function for creating a validated chat configuration.
 *
 * @example
 * ```ts
 * import { defineChatConfig } from '@/chat'
 * import SalesUnitCard from './cards/SalesUnitCard.vue'
 *
 * export const chatConfig = defineChatConfig({
 *   cards: {
 *     pending: { salesUnitSelector: SalesUnitCard },
 *     completed: { queryOrderList: OrderListCard },
 *   },
 *   toolDisplayNames: { selectSaleUnit: 'tool.selectSaleUnit' },
 *   transport: { api: '/api/chat', headers: { 'x-api-key': '...' } },
 *   avatar: {
 *     assistantName: '订单助手',
 *     assistantAvatar: '/ai-avatar.png',
 *     userName: '张三',
 *     userAvatar: '/user-avatar.png',
 *   },
 *   ui: {
 *     theme: 'light',
 *     inputPlaceholder: '请输入您的问题...',
 *   },
 * })
 * ```
 */
export function defineChatConfig(input: ChatConfigInput): ChatConfig {
  if (input.cards?.pending && Object.keys(input.cards.pending).length === 0) {
    console.warn('[ai-chat-core] No pending card components registered.')
  }

  return {
    cards: {
      pending: { ...input.cards?.pending },
      completed: { ...input.cards?.completed },
    },
    toolDisplayNames: { ...input.toolDisplayNames },
    transport: {
      api: input.transport?.api ?? '/api/chat',
      headers: input.transport?.headers ?? {},
      buildBody:
        input.transport?.buildBody ??
        (({ context, sender }) => ({ context, sender })),
    },
    voice: {
      enabled: input.voice?.enabled !== false,
      sttEndpoint: input.voice?.sttEndpoint ?? '/api/stt/open',
      sender: input.voice?.sender ?? '',
    },
    ui: {
      showHeader: input.ui?.showHeader ?? true,
      showEmptyState: input.ui?.showEmptyState ?? true,
      maxImageSize: input.ui?.maxImageSize ?? 5 * 1024 * 1024,
      theme: input.ui?.theme ?? 'auto',
      inputPlaceholder: input.ui?.inputPlaceholder ?? '',
      enableImageUpload: input.ui?.enableImageUpload ?? true,
      enableReset: input.ui?.enableReset ?? true,
      enableReasoning: input.ui?.enableReasoning ?? true,
    },
    avatar: {
      assistantName: input.avatar?.assistantName ?? '',
      assistantAvatar: input.avatar?.assistantAvatar ?? '',
      userName: input.avatar?.userName ?? '',
      userAvatar: input.avatar?.userAvatar ?? '',
      sender: input.avatar?.sender ?? '',
    },
    welcome: input.welcome,
  }
}
