# AIX Chat 快速开始指南

## 1. 安装依赖

```bash
cd aix-chat
pnpm install
```

## 2. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker-compose up -d

# 验证数据库运行
docker-compose ps
```

数据库会自动创建表结构（通过 `init.sql`）。

## 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 OpenAI API Key
# OPENAI_API_KEY=sk-xxx
```

## 4. 启动开发服务器

```bash
# 方式一：同时启动前后端
pnpm dev

# 方式二：分别启动
pnpm dev:server  # 后端：http://localhost:3000
pnpm dev:ui      # 前端：http://localhost:5173
```

## 5. 访问应用

打开浏览器访问：http://localhost:5173

## 项目结构说明

```
aix-chat/
├── packages/
│   ├── chat-ui/     # Vue 组件库（aix-chat）
│   ├── demo/        # 演示应用（aix-chat-demo）
│   └── server/      # 后端 API（aix-chat-server）
```

## 核心概念

### 1. 工具定义（tools.ts）

```typescript
import { defineTools } from 'aix-chat'
import OptionCard from './OptionCard.vue'

export const tools = defineTools([
  {
    name: 'showOptions',
    description: '展示选项让用户选择',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        options: { type: 'array' }
      }
    },
    component: OptionCard,
    mapProps: (args) => ({ title: args.title, options: args.options }),
    execute: async (args) => ({ pending: true, ...args })
  }
])
```

### 2. 使用 ChatApp

```vue
<script setup>
import { ChatApp } from 'aix-chat'
import { tools } from './tools'
</script>

<template>
  <ChatApp
    agent-id="my-agent"
    :tools="tools"
    system-prompt="你是助手..."
  />
</template>
```

### 3. 后端 API

只有一个端点：`POST /api/agent/chat`

请求体：
```json
{
  "agentId": "my-agent",
  "messages": [...],
  "tools": [...],
  "systemPrompt": "..."
}
```

## 开发流程

### 添加新工具

1. 在 `packages/demo/src/tools.ts` 中定义工具
2. 创建卡片组件 `packages/demo/src/components/YourCard.vue`
3. 在工具定义中引用组件

### 修改 UI

1. 修改 `packages/chat-ui/src/components/` 中的组件
2. 修改 `packages/chat-ui/src/styles/` 中的样式

### 修改后端

1. 修改 `packages/server/src/routes/agent-chat.ts`
2. 重启后端服务

## 常见问题

### Q: 如何切换 AI 模型？

修改 `.env` 文件：
```
OPENAI_MODEL=gpt-4o-mini  # 或其他模型
```

### Q: 如何添加更多演示？

在 `packages/demo/src/` 下创建新的目录，或复制现有的演示。

### Q: 如何部署？

```bash
# 构建
pnpm build

# 部署 server
cd packages/server
node dist/server.js

# 部署 demo
cd packages/demo
# 将 dist/ 目录部署到静态文件服务器
```

## 下一步

- 查看 `PROJECT_SUMMARY.md` 了解项目架构
- 查看 `packages/demo/src/tools.ts` 了解工具定义
- 查看 `packages/chat-ui/src/ChatApp.vue` 了解组件实现

## 技术支持

如有问题，请查看：
- README.md - 项目概览
- PROJECT_SUMMARY.md - 详细架构说明
- 各包的 package.json - 依赖和脚本
