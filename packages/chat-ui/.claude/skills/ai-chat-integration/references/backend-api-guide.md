# 后端 Agent API 对接指南

> 面向「不会开发」的同学：照着做就能把聊天页面接到后端。
> 如果你只需要用，不需要改后端，本文已经够用。

---

## 一、你要知道的 4 件事

1. **后端已经准备好**，你不需要写后端代码。
2. **你只需要做 3 件事**：配环境变量、复制一个 composable、改一行 transport 配置。
3. **后端会自动记住对话历史**，你不用自己存消息。
4. **出错时有明确提示**，不会悄悄失败。

---

## 二、后端给你什么接口

基础路径（举例）：`https://你的域名/api/agent`

| 接口 | 用途 | 你什么时候用 |
|---|---|---|
| `POST /api/agent/chat` | 发消息、拿 AI 回复（流式） | 用户每次发消息 |
| `GET  /api/agent/conversations` | 列出历史对话 | 打开"历史记录"页 |
| `POST /api/agent/conversations` | 新建对话 | 用户点"新建聊天" |
| `GET  /api/agent/conversations/:id/messages` | 拿某对话的历史消息 | 进入历史对话详情 |
| `DELETE /api/agent/conversations/:id` | 删除对话 | 用户点"删除" |

> 流式 = AI 一边想一边回，像打字机效果。`useChat` 会自动处理，你不用管。

---

## 三、鉴权：后端怎么知道你是谁

后端用 **JWT token** 识别用户。你的项目登录时应该已经拿到了 token，存在某个地方（Vuex / Pinia / localStorage）。

发请求时，在 header 带上：

```
Authorization: Bearer <你的 token>
```

> 不知道 token 在哪？问后端同事"登录接口返回的 token 字段叫什么"，前端一定已经存了。

---

## 四、照抄清单（5 分钟搞定）

### 第 1 步：配环境变量

在 `examples/web/.env`（或你的 `.env.local`）里加：

```bash
# 后端地址
VITE_API_BASE=https://你的后端域名

# 可选：如果你的项目用固定 apiKey 而非 JWT
VITE_APP_AI_KEY=your-api-key
```

### 第 2 步：复制 composable 模板

把 `templates/useAgentChat.ts.template` 复制到你的业务目录：

```bash
cp templates/useAgentChat.ts.template src/composables/useAgentChat.ts
```

文件里所有 `// 👈 改这里` 的地方，按注释改一下。通常只需要改两处：
- `agentId`：后端给你的 agent 名字（比如 `'mock-agent'`）
- 拿 token 的方式：从你项目的 store / localStorage 读

### 第 3 步：在页面里用

```vue
<script setup lang="ts">
import { useAgentChat } from '../composables/useAgentChat'

const {
  chat,
  chatBusy,
  pendingToolCall,
  resolving,
  handleSendMessage,
  handleQuickReply,
  handleResetChat,
} = useAgentChat()
</script>
```

把 `index.vue.template` 里原来的 `new Chat(...)` 换成上面这个 `chat`，其他都不用动。

### 第 4 步：改 chatConfig.ts 的 transport

```ts
export const chatConfig = defineChatConfig({
  // ...你的卡片注册...
  transport: {
    api: `${import.meta.env.VITE_API_BASE}/api/agent/chat`,  // 👈 改成 agent 路由
    headers: () => ({
      Authorization: `Bearer ${getToken()}`,  // 👈 你的取 token 函数
    }),
  },
})
```

### 第 5 步：验证

打开浏览器 DevTools → Network：
1. 发一条消息，看有没有 `POST /api/agent/chat` 请求
2. 响应头里有没有 `X-Conversation-Id`（后端返回的会话 id）
3. 响应类型是不是 `text/event-stream`

都满足 = 接上了 ✅

---

## 五、常见报错对照表

| 你看到的现象 | 原因 | 怎么办 |
|---|---|---|
| 401 Unauthorized | token 没带 / 过期了 | 重新登录，或检查取 token 的代码 |
| 404 Agent not found | `agentId` 写错 | 找后端确认正确的 agentId |
| 403 User lacks required roles | 你的账号没权限用这个 agent | 找后端加角色，或换一个 agentId |
| 400 Invalid request body | messages 格式错 | 不要自己拼 body，用模板里的 `useAgentChat` |
| 响应头有 `X-MCP-Degraded: true` | 后端工具挂了，已降级 | 告诉用户"部分功能暂不可用"，不是你的 bug |
| 流中途断了 | 网络抖动 | `useChat` 的 `onError` 会触发，提示用户重试 |

---

## 六、进阶：加载历史对话

你的页面如果要做"历史对话列表 + 点进去继续聊"：

```ts
import { ref } from 'vue'

const conversations = ref([])
const currentConvId = ref<string | undefined>()

// 拉列表
async function loadConversations() {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/agent/conversations?limit=20`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await res.json()
  conversations.value = data.items
}

// 进入某个历史对话 → 把 id 传给 useAgentChat
function openConversation(id: string) {
  currentConvId.value = id
  // 在 useAgentChat 里把 conversationId 设进去，自动续接
}

// 删除对话
async function deleteConversation(id: string) {
  await fetch(`${import.meta.env.VITE_API_BASE}/api/agent/conversations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  loadConversations()
}
```

`useAgentChat` 模板里已经预留了 `conversationId` 的接入点，取消注释即可。

---

## 七、不要做的事

- ❌ 不要自己拼 `messages` 数组，用 `chat.sendMessage()`，AI SDK 会帮你格式化
- ❌ 不要把 token 硬编码在代码里
- ❌ 不要忽略 `X-Conversation-Id` 响应头，丢了就=每次都是新对话
- ❌ 不要在 `agentId` 之外自己加字段（比如 `userId`），后端会从 token 里读

---

## 相关文档

- `templates/useAgentChat.ts.template` — 复制即用的 composable
- `references/config-reference.md` — chatConfig 完整配置
