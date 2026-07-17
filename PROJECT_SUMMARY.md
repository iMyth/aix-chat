# AIX Chat 项目总结

## 项目概述

这是一个完全简化的 AI 聊天项目，采用 monorepo 结构，包含三个核心包：

1. **aix-chat** - Vue 3 聊天组件库
2. **aix-chat-demo** - 订单助手演示应用
3. **aix-chat-server** - 简化的后端 API

## 与原项目的对比

### 后端简化

**原项目（复杂）：**
- 多个路由和中间件
- 复杂的工具加载系统
- MCP 工具池
- 对话历史持久化（PostgreSQL）
- 多种认证方式
- 复杂的错误处理

**新项目（简化）：**
- 只有一个 `/api/agent/chat` 端点
- 直接接收前端工具定义
- PostgreSQL 存储对话历史（Docker）
- 简单的 JWT 认证
- 最小化错误处理

### 前端保持

前端保持了之前重构的所有优点：
- `ChatApp` 组件开箱即用
- `defineTools` 统一管理工具
- 自动处理卡片注册和事件路由
- 响应式设计

## 文件结构

```
aix-chat/
├── packages/
│   ├── chat-ui/              # Vue 组件库
│   │   ├── src/
│   │   │   ├── ChatApp.vue   # 主组件
│   │   │   ├── components/   # UI 组件
│   │   │   ├── composables/  # Vue composables
│   │   │   ├── tools/        # 工具定义 API
│   │   │   ├── config/       # 配置管理
│   │   │   ├── provider/     # Vue provider
│   │   │   ├── registry/     # 卡片注册表
│   │   │   ├── styles/       # 样式文件
│   │   │   └── index.ts      # 导出
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── demo/                 # 演示应用
│   │   ├── src/
│   │   │   ├── App.vue       # 主应用
│   │   │   ├── main.ts       # 入口
│   │   │   ├── tools.ts      # 工具定义
│   │   │   └── components/   # 卡片组件
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── server/               # 后端 API
│       ├── src/
│       │   ├── server.ts     # 服务器入口
│       │   ├── routes/
│       │   │   └── agent-chat.ts  # 聊天路由
│       │   ├── libs/
│       │   │   └── db.ts          # 数据库连接
│       │   └── repositories/
│       │       └── conversation.ts # 对话仓储
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── docker-compose.yml        # PostgreSQL 数据库
├── init.sql                  # 数据库初始化脚本
├── package.json              # Monorepo 配置
├── pnpm-workspace.yaml       # 工作区配置
├── .npmrc                    # npm 配置
├── .gitignore
├── .env.example
└── README.md
```

## 核心特性

### 1. 极简后端

```typescript
// 只有一个端点
POST /api/agent/chat

// 请求体
{
  agentId: string,
  messages: [],
  tools: [],        // 前端定义的工具
  systemPrompt: string
}

// 响应：SSE 流式输出
```

### 2. 前端工具定义

```typescript
const tools = defineTools([
  {
    name: 'showOptions',
    description: '展示选项',
    parameters: { /* JSON Schema */ },
    component: OptionCard,
    mapProps: (args) => ({ ... }),
    execute: async (args) => ({ pending: true, ... }),
    onEvent: (eventName, data) => { ... }
  }
])
```

### 3. 一键集成

```vue
<ChatApp
  agent-id="my-agent"
  :tools="tools"
  system-prompt="..."
/>
```

## 使用流程

1. **定义工具**（前端）
   - 创建工具 schema
   - 创建卡片组件
   - 定义执行逻辑

2. **使用组件**（前端）
   - 导入 ChatApp
   - 传入工具和配置
   - 完成

3. **调用 API**（后端）
   - 接收请求
   - 调用 AI
   - 返回流式响应

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **后端**：Fastify + AI SDK
- **AI**：OpenAI GPT-4
- **Monorepo**：pnpm workspaces

## 开发命令

```bash
# 启动数据库
docker-compose up -d

# 安装依赖
pnpm install

# 开发模式
pnpm dev:server  # 启动后端
pnpm dev:ui      # 启动前端

# 构建
pnpm build       # 构建所有
pnpm build:ui    # 只构建 UI
pnpm build:server # 只构建后端

# 数据库管理
docker-compose logs -f postgres  # 查看日志
docker-compose down              # 停止数据库
docker-compose down -v           # 停止并删除数据
```

## 优势

1. **极简设计**：去除了所有不必要的复杂性
2. **前后端分离**：清晰的分层架构
3. **持久化存储**：使用 PostgreSQL 存储对话历史
4. **易于理解**：代码量大幅减少
5. **快速上手**：5 分钟即可运行
6. **灵活扩展**：基于需求添加功能

## 数据库架构

### 表结构

**conversations 表**
- `id`: UUID 主键
- `agent_id`: Agent 标识
- `user_id`: 用户标识
- `created_at`: 创建时间
- `updated_at`: 更新时间

**messages 表**
- `id`: UUID 主键
- `conversation_id`: 外键关联 conversations
- `role`: 消息角色（user/assistant/tool/system）
- `content`: 消息内容
- `tool_calls`: 工具调用（JSONB）
- `tool_call_id`: 工具调用 ID
- `created_at`: 创建时间

### 连接配置

```
Host: localhost:5432
User: aix
Password: aix123
Database: aix_chat
Connection: postgresql://aix:aix123@localhost:5432/aix_chat
```

## 下一步

1. 安装依赖：`pnpm install`
2. 配置环境变量：`cp .env.example .env`
3. 填入 OpenAI API Key
4. 启动服务：`pnpm dev`
5. 访问 http://localhost:5173

## 总结

这个项目展示了如何将一个复杂的企业级应用简化为一个清晰、易用的开源项目。通过：

- 移除不必要的复杂性
- 保持核心功能完整
- 提供清晰的文档
- 简化部署流程

使得任何开发者都能快速理解和使用。
