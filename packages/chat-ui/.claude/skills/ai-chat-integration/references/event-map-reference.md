# Card Event 路由参考

## 事件流

```
卡片组件 emit('select', payload)
    ↓
CardRenderer 包装为:
  { eventName: 'select', cardType: 'optionSelector', data: payload }
    ↓
ChatMessageList emit('cardEvent', ...)
    ↓
index.vue 的 routeCardEvent() 根据 cardType + eventName 路由
    ↓
EVENT_HANDLER_MAP[eventName](data)
    ↓
handlers.xxx(data) → 更新业务状态 → resolve(result) → AI 继续
```

## 事件命名约定

| 卡片 emit | routeCardEvent 中 eventName | 说明 |
|-----------|---------------------------|------|
| `@select` | `select` | 用户选中了选项 |
| `@confirm` | `confirm` | 用户确认了表单 |
| `@cancel` | `cancel` | 用户取消了操作 |
| `@close` | `close` | 用户关闭了卡片 |
| `@viewDetail` | `viewDetail` | 用户点击了详情 |
| `@scrollToBottom` | (内部处理) | 请求滚动到底部 |

## EVENT_HANDLER_MAP 模板

```ts
const EVENT_HANDLER_MAP: Record<string, (payload: any) => void> = {
  select: (item) => {
    resolve({ success: true, selected: item })
    // 可选：添加 AI 回复
  },
  confirm: (data) => {
    resolve({ success: true, formData: data })
  },
  cancel: () => {
    resolve({ success: true, cancelled: true })
  },
  close: () => {
    resolve({ success: true })
  },
  viewDetail: (item) => {
    resolve({ success: true })
    // 可触发新的 AI 查询
  },
}
```

## routeCardEvent 函数

```ts
function routeCardEvent({ eventName, cardType, data }) {
  const handler = EVENT_HANDLER_MAP[eventName]
  if (handler) {
    handler(data)
  } else {
    console.warn('Unknown card event:', eventName, cardType)
  }
}
```

在 `<ChatMessageList>` 上绑定：
```vue
<ChatMessageList
  :messages="chat.messages"
  @card-event="routeCardEvent"
  @quick-reply="handleQuickReply"
/>
```
