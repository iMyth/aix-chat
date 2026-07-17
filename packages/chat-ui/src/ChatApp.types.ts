import type { ToolConfig } from './tools/createChat'

/**
 * ChatApp 组件 Props
 *
 * @example
 * ```vue
 * <ChatApp
 *   agent-id="order-assistant"
 *   api-base="http://localhost:3000"
 *   api-endpoint="/api/agent/chat"
 *   :headers="{ Authorization: 'Bearer xxx' }"
 *   assistant-name="订单助手"
 *   assistant-avatar="/ai-avatar.png"
 *   user-name="张三"
 *   user-avatar="/user-avatar.png"
 *   :tools="tools"
 *   system-prompt="你是一个专业的订单助手..."
 *   :welcome="{ text: '你好！', quickReplies: [...] }"
 *   :enable-voice="true"
 *   :enable-image-upload="true"
 *   :enable-reasoning="true"
 *   input-placeholder="请输入您的问题..."
 * />
 * ```
 */
export interface ChatAppProps {
  // ===== 基础配置 =====
  /** Agent 标识符（必填） */
  agentId: string
  /** API 基础地址，如 http://localhost:3000 */
  apiBase?: string
  /** API 端点路径，默认 /api/agent/chat */
  apiEndpoint?: string
  /** 请求头，支持对象或返回对象的函数 */
  headers?: Record<string, string> | (() => Record<string, string>)

  // ===== AI 助手配置 =====
  /** AI 助手名称，显示在消息气泡中 */
  assistantName?: string
  /** AI 助手头像 URL */
  assistantAvatar?: string

  // ===== 用户配置 =====
  /** 用户名称 */
  userName?: string
  /** 用户头像 URL */
  userAvatar?: string
  /** 用户标识（用于语音识别等） */
  sender?: string

  // ===== UI 配置 =====
  /** 是否显示头部，默认 true */
  showHeader?: boolean
  /** 是否显示空状态，默认 true */
  showEmptyState?: boolean
  /** 输入框占位符文字 */
  inputPlaceholder?: string
  /** 主题：light / dark / auto，默认 auto */
  theme?: 'light' | 'dark' | 'auto'

  // ===== 功能开关 =====
  /** 是否启用语音输入，默认 true */
  enableVoice?: boolean
  /** 是否启用图片上传，默认 true */
  enableImageUpload?: boolean
  /** 是否启用重置按钮，默认 true */
  enableReset?: boolean
  /** 是否启用思考过程显示，默认 true */
  enableReasoning?: boolean
  /** 最大图片大小（字节），默认 5MB */
  maxImageSize?: number

  // ===== 提示词配置 =====
  /** 系统提示词 */
  systemPrompt?: string
  /** 欢迎消息配置 */
  welcome?: {
    text: string
    quickReplies?: Array<{ label: string; value: string }>
  }

  // ===== 工具配置 =====
  /** 工具定义（支持数组或 defineTools() 返回值） */
  tools?: ToolConfig[] | { tools: ToolConfig[]; [key: string]: any }
}
