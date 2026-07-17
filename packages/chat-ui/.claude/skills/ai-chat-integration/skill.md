---
name: ai-chat-integration
description: |
  指导将 aix-chat 聊天组件库集成到 Vue 3 业务系统。
  帮助构建业务专属卡片组件、工具定义，并将它们接入聊天系统。
  包含后端 Agent API 对接（不会开发也能照抄）。
  触发场景：添加新卡片、创建聊天工具、配置聊天包、调试卡片渲染问题、接入后端 Agent API。
triggers:
  - "add a new card to the AI chat"
  - "create a chat tool"
  - "how to integrate aix-chat"
  - "card component for AI assistant"
  - "register a card type"
  - "connect to the agent backend"
  - "how to call /api/agent/chat"
  - "添加AI聊天卡片"
  - "创建聊天工具"
  - "接入聊天组件库"
  - "对接后端api"
  - "怎么接agent接口"
---

# AI 聊天组件库集成指南

你正在帮助开发者将 `aix-chat` 聊天组件库集成到 Vue 3 业务系统，
并构建业务专属的卡片组件。

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│  aix-chat (通用聊天组件库)                             │
│  ChatMessageList / ChatMessage / ChatInput / ...     │
│  CardRenderer → 通过注册表动态渲染业务卡片              │
│  defineChatConfig() → 配置工厂                         │
────────────────────┬────────────────────────────────┘
                     │ provide/inject
┌────────────────────┴────────────────────────────────┐
│  你的业务系统 (消费方)                                  │
│  chatConfig.ts → 注册卡片 + 工具名 + Transport 配置    │
│  你的卡片组件 → OptionSelectorCard, SimpleFormCard 等  │
│  index.vue → Chat 实例 + Card Event 路由             │
└─────────────────────────────────────────────────────┘
```

## 集成步骤

### 第一步：安装依赖

确保 `package.json` 包含以下依赖：
```json
{
  "dependencies": {
    "vue": "^3.5.0",
    "vue-i18n": "^11.0.0",
    "ai": "^7.0.0",
    "@ai-sdk/vue": "^4.0.0",
    "aix-chat": "workspace:*"
  },
  "devDependencies": {
    "sass": "^1.77.0",
    "unplugin-icons": "^23.0.0",
    "@iconify-json/mdi": "^1.2.0"
  }
}
```

并确保 `vite.config.ts` 配置了图标插件：
```ts
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
  plugins: [
    // ... 其他插件
    AutoImport({ resolvers: [IconsResolver({ prefix: 'Icon' })] }),
    Components({ resolvers: [IconsResolver({ prefix: 'Icon', enabledCollections: ['mdi'] })] }),
    Icons({ compiler: 'vue3', autoInstall: true }),
  ],
})
```

模板中直接使用 `<IconMdiXxx />` 组件名（如 `<IconMdiArrowUp />`）。

### 第二步：创建目录结构

```
src/
├── components/          # 你的卡片组件
│   ├── OptionSelectorCard.vue
│   ├── SimpleFormCard.vue
│   └── SimpleListCard.vue
├── tools.ts            # 工具定义
├── App.vue             # 页面入口
└── main.ts            # 应用入口
```

### 第三步：定义工具

使用 `defineTools()` 定义工具列表。它返回一个对象，包含工具数组和辅助方法：

```ts
import { defineTools } from 'aix-chat'
import OptionSelectorCard from './components/OptionSelectorCard.vue'
import SimpleListCard from './components/SimpleListCard.vue'

export const tools = defineTools([
  {
    name: 'showQuickActions',
    description: '展示快捷操作选项让用户选择',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '卡片标题' },
        options: {
          type: 'array',
          description: '选项列表',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: '显示文字' },
              value: { type: 'string', description: '选项值' },
            },
            required: ['label', 'value'],
          },
        },
      },
      required: ['title', 'options'],
    },
    component: OptionSelectorCard,
    mapProps: (args) => ({
      title: args.title,
      options: args.options,
    }),
    execute: async (args) => ({
      pending: true,
      type: 'showQuickActions',
      title: args.title,
      options: args.options,
    }),
    onEvent: (eventName, data) => {
      console.log('Event:', eventName, data)
    },
  },
])

// defineTools 返回的对象包含：
// - tools: 原始工具数组
// - schemas: 工具 schema（传给后端）
// - pendingCards: 卡片组件注册表
// - getTool(name): 根据名称获取工具
// - executeTool(name, args): 执行工具
```

### 第三步（续）：配置后端 Agent API

如果你的 AI 聊天要接 `/api/agent/chat`（多业务 Agent 网关，带 MCP 工具 + 持久化对话历史），
读取 [references/backend-api-guide.md] 并参考 demo 项目的实现。

**最小接入只需改 3 处**：
1. 在 `.env` 加 `VITE_DEV_TOKEN`
2. 在 `App.vue` 改 `agent-id` 和 API 地址
3. 在 `tools.ts` 定义你的业务工具

### 第四步：创建卡片组件

读取 [references/card-component-guide.md] 了解卡片组件接口约定。

核心约定：
- **Props**：由 AI 工具返回的数据形状决定（`pendingToolCall.result` 的内容）
- **Emits**：卡片 emit 语义化事件（`select`, `cancel`, `confirm`, `close`, `viewDetail`）
- **样式**：使用 `@use 'aix-chat/styles/chat-card'` 导入样式 mixin

### 第五步：创建页面入口

在 `App.vue` 中使用 `<ChatApp>` 组件：

```vue
<script setup lang="ts">
import { ChatApp } from 'aix-chat'
import { tools } from './tools'

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_DEV_TOKEN || 'dev-token'}`,
}
</script>

<template>
  <ChatApp
    agent-id="order-assistant"
    api-base="http://localhost:3000"
    api-endpoint="/api/agent/chat"
    :headers="headers"
    assistant-name="订单助手"
    assistant-avatar="/ai-avatar.png"
    user-name="张三"
    :tools="tools"
    system-prompt="你是一个专业的订单助手，帮助用户处理订单相关的操作。

你可以：
1. 展示快捷操作选项（showQuickActions）- 当需要用户从预定义选项中选择时
2. 展示订单表单（showOrderForm）- 当需要用户填写订单信息时
3. 查询订单列表（queryOrderList）- 当用户想查看订单时

请用友好、专业的语气与用户交流。"
    :welcome="{
      text: '你好！我是订单助手 👋\n\n我可以帮你完成以下操作：',
      quickReplies: [
        { label: '下订单', value: '我想下一个新订单' },
        { label: '查询订单', value: '帮我查询最近的订单' },
      ],
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    input-placeholder="请输入您的问题..."
  />
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
```

**ChatApp Props 说明：**

#### 基础配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `agent-id` | `string` | **必填** | Agent 标识符 |
| `api-base` | `string` | `''` | API 基础地址，如 `http://localhost:3000` |
| `api-endpoint` | `string` | `'/api/agent/chat'` | API 端点路径 |
| `headers` | `Record<string, string> \| () => Record<string, string>` | `{}` | 请求头（支持对象或返回对象的函数） |

#### AI 助手配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `assistant-name` | `string` | `''` | AI 助手名称，显示在消息气泡中 |
| `assistant-avatar` | `string` | `''` | AI 助手头像 URL |

#### 用户配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `user-name` | `string` | `''` | 用户名称 |
| `user-avatar` | `string` | `''` | 用户头像 URL |
| `sender` | `string` | `''` | 用户标识（用于语音识别等） |

#### UI 配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `show-header` | `boolean` | `true` | 是否显示头部 |
| `show-empty-state` | `boolean` | `true` | 是否显示空状态 |
| `input-placeholder` | `string` | `''` | 输入框占位符文字 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 主题模式 |

#### 功能开关
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable-voice` | `boolean` | `true` | 是否启用语音输入 |
| `enable-image-upload` | `boolean` | `true` | 是否启用图片上传 |
| `enable-reset` | `boolean` | `true` | 是否启用重置按钮 |
| `enable-reasoning` | `boolean` | `true` | 是否启用思考过程显示 |
| `max-image-size` | `number` | `5242880` (5MB) | 最大图片大小（字节） |

#### 提示词配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `system-prompt` | `string` | `''` | 系统提示词 |
| `welcome` | `{ text: string; quickReplies?: Array<{ label: string; value: string }> }` | - | 欢迎消息配置 |

#### 工具配置
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tools` | `ToolConfig[] \| { tools: ToolConfig[]; [key: string]: any }` | `[]` | 工具定义（支持数组或 `defineTools()` 返回值） |

**完整示例：**
```vue
<template>
  <ChatApp
    agent-id="order-assistant"
    api-base="http://localhost:3000"
    api-endpoint="/api/agent/chat"
    :headers="{ Authorization: 'Bearer xxx' }"
    assistant-name="订单助手"
    assistant-avatar="/ai-avatar.png"
    user-name="张三"
    user-avatar="/user-avatar.png"
    :tools="tools"
    system-prompt="你是一个专业的订单助手..."
    :welcome="{
      text: '你好！我是订单助手 👋',
      quickReplies: [
        { label: '下订单', value: '我想下一个新订单' },
      ],
    }"
    :enable-voice="true"
    :enable-image-upload="true"
    :enable-reasoning="true"
    input-placeholder="请输入您的问题..."
  />
</template>
```

**关键特性：**
- ✅ 自动处理流式响应
- ✅ 自动处理工具调用和卡片渲染
- ✅ 自动注入欢迎消息
- ✅ 支持 `defineTools()` 返回的对象格式
- ✅ 完整的头像/名称自定义
- ✅ 功能开关（语音、图片、思考过程等）
- ✅ 主题支持（light/dark/auto）

### 第六步：定义 AI 工具（可选）

如果你的 AI 需要调用自定义工具，读取模板 `templates/ToolDefinition.ts.template`。

## 验证清单

- [ ] 卡片在 AI 触发工具时正确渲染
- [ ] 用户交互 emit 正确的事件
- [ ] 事件路由到正确的 handler
- [ ] 卡片在消息历史中正确显示（如果是 completed 类型）
- [ ] 移动端响应式布局正常
- [ ] 暗色模式样式正确
