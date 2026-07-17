import { Chat } from '@ai-sdk/vue'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ImageStrippingTransport } from '../composables/useImageStrippingTransport'
import { usePendingToolCall } from '../composables/usePendingToolCall'
import { ref, computed, type Component } from 'vue'

/**
 * 工具定义（JSON Schema 格式）
 */
export interface ToolDefinition {
  name: string
  description?: string
  parameters?: Record<string, any>
}

/**
 * 工具配置（带 UI 和执行逻辑）
 */
export interface ToolConfig<TArgs = any, TResult = any> extends ToolDefinition {
  /** Vue 组件（用于渲染卡片） */
  component?: Component
  /** 工具执行函数 */
  execute?: (args: TArgs) => Promise<TResult>
  /** 数据映射：工具参数 -> 组件 props */
  mapProps?: (args: TArgs) => Record<string, any>
  /** 卡片事件回调 */
  onEvent?: (eventName: string, data: any) => void
}

/**
 * createChat 配置选项
 */
export interface CreateChatOptions {
  /** Agent ID */
  agentId: string
  /** API 基础地址（默认空，走相对路径） */
  apiBase?: string
  /** API 端点（默认 /api/agent/chat） */
  apiEndpoint?: string
  /** 请求头（如 Authorization） */
  headers?: Record<string, string> | (() => Record<string, string>)
  /** 系统提示 */
  systemPrompt?: string
  /** 工具 schema 列表 */
  tools?: ToolDefinition[]
  /** 工具执行函数，返回结果如果包含 pending: true 则自动设置 pending 状态 */
  onToolCall?: (toolName: string, args: any) => Promise<any>
  /** 错误回调 */
  onError?: (error: any) => void
}

/**
 * 创建 Chat 实例（工厂函数）
 *
 * @example
 * ```ts
 * const { chat, pendingToolCall, ... } = createChat({
 *   agentId: 'order-assistant',
 *   systemPrompt: '你是订单助手...',
 *   tools: myTools.schemas,
 *   onToolCall: myTools.executeTool,
 * })
 * ```
 */
export function createChat(options: CreateChatOptions) {
  const {
    agentId,
    apiBase = '',
    apiEndpoint = '/api/agent/chat',
    headers = {},
    systemPrompt,
    tools = [],
    onToolCall,
    onError,
  } = options

  // 工具执行计数
  const toolExecutingCount = ref(0)

  // 构造 headers
  const getHeaders = () => {
    if (typeof headers === 'function') return headers()
    return headers
  }

  // 创建 transport
  const transport = new ImageStrippingTransport({
    api: `${apiBase}${apiEndpoint}`,
    headers: getHeaders,
    body: () => ({
      agentId,
      systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
    }),
  })

  // 先创建 usePendingToolCall（需要提前声明以便在 onToolCall 中使用）
  let setPendingRef: ((toolCall: any, result: any) => void) | null = null

  // 创建 Chat 实例
  const chat = new Chat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError(err) {
      console.error('[createChat] Chat error:', err)
      onError?.(err)
    },
    async onToolCall({ toolCall }) {
      if (!onToolCall) {
        console.warn(`[createChat] Tool "${toolCall.toolName}" called but no onToolCall handler provided`)
        return
      }

      toolExecutingCount.value++
      try {
        // 兼容不同版本的 AI SDK
        const input = (toolCall as any).input ?? (toolCall as any).args ?? {}
        const result = await onToolCall(toolCall.toolName, input)

        // 如果返回结果包含 pending: true，表示需要 UI 交互
        if (result?.pending) {
          // 设置 pending 状态
          if (setPendingRef) {
            setPendingRef(
              { toolName: toolCall.toolName, toolCallId: toolCall.toolCallId },
              result,
            )
          }
          return // 不调用 addToolOutput，等待用户交互
        }

        // 非 pending 工具，直接返回结果
        chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: result,
        })
      } catch (err) {
        console.error(`[createChat] Tool "${toolCall.toolName}" execution error:`, err)
        chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: err instanceof Error ? err.message : '工具执行失败',
        })
      } finally {
        toolExecutingCount.value--
      }
    },
  })

  // 使用 usePendingToolCall
  const { pendingToolCall, resolving, setPending, resolve } = usePendingToolCall(chat as any)

  // 保存 setPending 引用供 onToolCall 使用
  setPendingRef = setPending

  // 计算属性
  const chatBusy = computed(() => chat.status !== 'ready' && chat.status !== 'error')
  const isProcessing = computed(() => chatBusy.value || resolving.value || toolExecutingCount.value > 0)

  // 发送消息
  async function sendMessage(content: { text: string; files?: FileList | null }) {
    if (isProcessing.value) return
    try {
      await chat.sendMessage({ text: content.text, files: content.files ?? undefined })
    } catch (err) {
      console.error('[createChat] 发送失败:', err)
      throw err
    }
  }

  // 快速回复
  function quickReply(text: string) {
    sendMessage({ text })
  }

  // 重置对话
  function resetChat() {
    chat.stop()
    if (pendingToolCall.value) pendingToolCall.value = null
    toolExecutingCount.value = 0
    resolving.value = false
    chat.messages = []
  }

  return {
    // Chat 实例
    chat,
    chatBusy,
    isProcessing,

    // 工具相关
    pendingToolCall,
    resolving,
    toolExecutingCount,
    setPending,
    resolve,

    // 操作方法
    sendMessage,
    quickReply,
    resetChat,
  }
}
