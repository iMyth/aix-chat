# aix-chat 使用反馈与改进建议

## 问题 1：i18n 配置缺失导致运行报错 ⚠️ 严重

### 现象
按照文档"最简用法"示例直接使用，会抛出以下错误：
```
Uncaught SyntaxError: Need to install with `app.use` function
at aix-chat.js:28224:106
```

### 原因
`aix-chat` 组件内部使用了 `vue-i18n` 的 `useI18n()` hook（在 `MarkdownRenderer.vue`、`ChatInput.vue`、`ChatMessage.vue` 等多个组件中），但文档的"最简用法"示例没有提及需要配置 i18n。

### 复现步骤
1. `npm install aix-chat`
2. 按照文档"最简用法"复制代码
3. 运行项目 → 报错

### 期望行为
文档应该提供完整可运行的最简示例，包括 i18n 配置。

### 建议修复

**方案 A（推荐）：在文档中补充 i18n 配置**

修改"最简用法"示例为：

```vue
<script setup>
import { createI18n } from 'vue-i18n'
import { ChatApp, en, zh } from 'aix-chat'
import 'aix-chat/style.css'

// 必须配置 i18n
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: { en, zh },
})
</script>

<template>
  <!-- 需要在 app 挂载时 use i18n -->
  <ChatApp agent-id="my-agent" api-base="http://localhost:3000" />
</template>
```

并在 `main.ts` 中说明：
```typescript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
// 需要先安装 i18n（假设在 App.vue 或单独文件中已创建）
app.use(i18n)
app.mount('#app')
```

**方案 B（更优）：在组件内部自动初始化 i18n**

让 `ChatApp` 组件在没有检测到 i18n 时，自动创建一个默认的 i18n 实例，避免用户手动配置。

---

## 问题 2：i18n JSON 文件未打包到 npm 包 ⚠️ 严重

### 现象
尝试导入 i18n 语言包时报错：
```typescript
import { en, zh } from 'aix-chat'
// Error: Cannot find module 'aix-chat/dist/i18n/en.json'
```

### 原因
检查 npm 包发现：
- `package.json` 的 `exports` 字段声明了：`export { default as en } from './i18n/en.json'`
- 但 `dist/i18n/` 目录下只有 `index.d.ts`，没有 `en.json` 和 `zh.json` 文件

### 验证
```bash
ls node_modules/aix-chat/dist/i18n/
# 输出：index.d.ts（缺少 en.json 和 zh.json）
```

### 影响
用户无法按照文档导入语言包，必须从源码目录手动复制。

### 建议修复

修改 `packages/chat-ui/vite.config.ts` 或构建脚本，确保 i18n JSON 文件被复制到 dist 目录：

```typescript
// vite.config.ts 示例
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copy } from 'vite-plugin-copy'

export default defineConfig({
  plugins: [
    vue(),
    copy({
      targets: [
        { src: 'src/i18n/*.json', dest: 'dist/i18n' }
      ]
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es']
    }
  }
})
```

或者在 `package.json` 的 `files` 字段中明确包含：
```json
{
  "files": [
    "dist",
    "src/i18n",
    "src/styles",
    ".claude",
    "scripts"
  ]
}
```

---

## 问题 3：peerDependencies 安装说明不清晰 📝 文档改进

### 现象
`aix-chat` 的 `peerDependencies` 包含：
- `vue@^3.5.0`
- `vue-i18n@^11.0.0`
- `ai@^7.0.0`
- `@ai-sdk/vue@^4.0.0`

但文档只在"安装"章节写了：
```bash
npm install aix-chat
```

### 问题
虽然 npm 7+ 会自动安装 peer dependencies，但：
1. 用户可能不清楚需要这些额外的包
2. 在某些包管理器（如 pnpm、yarn）中可能需要显式安装
3. 文档没有说明版本兼容性要求

### 建议修复

在文档的"安装"章节补充完整命令：

```bash
# npm
npm install aix-chat vue-i18n@^11.0.0 ai@^7.0.0 @ai-sdk/vue@^4.0.0

# pnpm
pnpm add aix-chat vue-i18n@^11.0.0 ai@^7.0.0 @ai-sdk/vue@^4.0.0

# yarn
yarn add aix-chat vue-i18n@^11.0.0 ai@^7.0.0 @ai-sdk/vue@^4.0.0
```

或者添加一个"前置要求"章节，列出所有必需的依赖。

---

## 问题 4：mountChat() 示例同样缺少 i18n 配置 📝 文档改进

### 现象
文档的"其他用法"章节中，`mountChat()` 示例也没有提及 i18n 配置：

```typescript
import { mountChat } from 'aix-chat'
import 'aix-chat/style.css'

const { unmount } = mountChat('#app', {
  agentId: 'my-agent',
  apiBase: 'http://localhost:3000'
})
```

### 影响
使用 `mountChat()` 的用户同样会遇到 i18n 报错。

### 建议修复

如果选择方案 A（手动配置 i18n），需要在 `mountChat()` 示例中也补充 i18n 配置说明。

如果选择方案 B（自动初始化 i18n），则无需修改。

---

## 问题 5：TypeScript 类型导出不完整 🔧 体验优化

### 现象
尝试在工具定义中使用类型时，发现部分类型未导出：

```typescript
import type { ToolConfig } from 'aix-chat' // ✅ 可以导入
import type { OptionCardProps } from 'aix-chat' // ❌ 无法导入（如果需要自定义卡片）
```

### 影响
用户自定义卡片组件时，无法获得完整的类型提示。

### 建议修复

在 `src/index.ts` 中导出更多类型：

```typescript
export type { ChatAppProps } from './ChatApp.types'
export type { ToolConfig, ToolDefinition, CreateChatOptions } from './tools'
// 补充：
export type { ChatConfig, ChatConfigInput } from './config/types'
export type { CardRegistry } from './registry/types'
```

---

## 总结

### 优先级排序
1. 🔴 **P0 - 必须修复**：问题 2（i18n JSON 文件未打包）
2. 🔴 **P0 - 必须修复**：问题 1（文档补充 i18n 配置）
3. 🟡 **P1 - 建议改进**：问题 3（peerDependencies 安装说明）
4. 🟡 **P1 - 建议改进**：问题 4（mountChat 示例补充）
5. 🟢 **P2 - 体验优化**：问题 5（TypeScript 类型导出）

### 建议优先级
先修复问题 2，确保 i18n 文件可以正常导入，然后在文档中补充完整配置说明。

---

## 附录：完整的正确示例

为了让其他用户能快速上手，提供一个完整的、可直接运行的示例：

### package.json
```json
{
  "dependencies": {
    "aix-chat": "^1.0.3",
    "vue": "^3.5.13",
    "vue-i18n": "^11.0.0",
    "ai": "^7.0.0",
    "@ai-sdk/vue": "^4.0.0"
  }
}
```

### src/main.ts
```typescript
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { en, zh } from 'aix-chat'
import 'aix-chat/style.css'
import App from './App.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: { en, zh },
})

createApp(App).use(i18n).mount('#app')
```

### src/App.vue
```vue
<script setup>
import { ChatApp } from 'aix-chat'
</script>

<template>
  <ChatApp 
    agent-id="my-agent" 
    api-base="http://localhost:3000" 
  />
</template>
```

这个示例包含了所有必要的配置，用户复制粘贴即可运行。
