# defineChatConfig() API 参考

```ts
import { defineChatConfig } from '@/chat'
import type { ChatConfigInput } from '@/chat'

const config = defineChatConfig(input: ChatConfigInput): ChatConfig
```

## 参数

### `cards` — 卡片组件注册

```ts
cards: {
  pending?: Record<string, Component>   // 待交互卡片（type → 组件）
  completed?: Record<string, Component> // 已完成结果（toolName → 组件）
}
```

- `pending`: 当 AI 工具调用返回 `result.type` 时，`CardRenderer` 查找此映射渲染对应组件
- `completed`: 当工具已完成（出现在消息历史中），以只读模式渲染

### `toolDisplayNames` — 工具显示名

```ts
toolDisplayNames?: Record<string, string>  // toolName → i18n key
```

控制 `ChatMessage.vue` 中工具调用指示器的显示文字。

### `transport` — 后端配置

```ts
transport?: {
  api: string                              // AI 聊天 API 地址（默认 '/api/chat'）
  headers?: Record<string, string>         // 请求头（如认证 key）
  buildBody?: (params: {                   // 自定义请求体构造
    context: string
    sender: string
  }) => Record<string, unknown>
}
```

### `voice` — 语音输入配置

```ts
voice?: {
  enabled?: boolean       // 启用语音输入（默认 true）
  sttEndpoint?: string    // STT API 地址（默认 '/api/stt/open'）
  sender?: string         // 发送者标识（传给 STT 接口）
}
```

### `ui` — UI 选项

```ts
ui?: {
  showHeader?: boolean      // 显示聊天头部（默认 true）
  showEmptyState?: boolean  // 显示空状态（默认 true）
  maxImageSize?: number     // 最大图片大小 bytes（默认 5MB）
}
```

### `welcome` — 欢迎消息

```ts
welcome?: {
  text: string                                    // 欢迎文本（支持 markdown）
  quickReplies?: Array<{                          // 快捷回复按钮
    label: string
    value: string
  }>
}
```

## 返回值

返回完整的 `ChatConfig` 对象，已填充所有默认值。直接传给 `<AiChatProvider :config="...">`。
