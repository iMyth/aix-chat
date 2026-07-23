# 卡片组件开发指南

## 接口约定

每个业务卡片组件必须遵循以下约定，才能被 `CardRenderer` 正确渲染和事件路由。

### Props

Props 由 AI 工具返回的数据形状决定。数据来自 `pendingToolCall.result` 对象的各字段。

```ts
// 如果 AI 工具返回：
{
  type: 'myCardType',
  title: '请选择',
  options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]
}

// 你的组件应该接收：
defineProps<{
  title?: string
  options?: Array<{ label: string; value: string }>
}>()
```

### Emits

卡片 emit 语义化事件，`CardRenderer` 将它们统一包装为 `cardEvent`：

| Card 发出的事件 | 路由后的 eventName | 典型用途 |
|----------------|-------------------|---------|
| `@select`      | `select`          | 用户选中选项 |
| `@confirm`     | `confirm`         | 用户确认表单 |
| `@cancel`      | `cancel`          | 用户取消操作 |
| `@close`       | `close`           | 关闭卡片 |
| `@viewDetail`  | `viewDetail`      | 查看详情 |
| `@scrollToBottom` | (内部事件)      | 请求父级滚动到底部 |

**特殊**：`@scrollToBottom` 不会进入事件路由，而是直接由 `ChatMessageList` 处理。

### 样式

卡片样式推荐使用 `@use` 导入共享 SCSS mixin：

```vue
<style scoped lang="scss">
@use 'aix-chat/styles/chat-card';

.my-card {
  @include chat-card.card-base;         // 卡片外壳
}
.card-header {
  @include chat-card.card-header;       // 渐变头部
}
.card-title {
  @include chat-card.card-title;        // 标题文字
}
.card-content {
  @include chat-card.card-content;      // 可滚动内容区
}
.card-footer {
  @include chat-card.card-footer;       // 底部按钮栏
}
.btn-cancel {
  @include chat-card.btn-cancel;        // 取消按钮样式
}
.btn-confirm {
  @include chat-card.btn-confirm;       // 确认按钮样式
}
.card-grid {
  @include chat-card.selector-grid;     // 选项网格布局
}
.card-item {
  @include chat-card.selector-item;     // 单个选项样式
}
</style>
```

## 卡片类型模板

### 选择型卡片（Selection Card）

适用于：销售单位选择、配送方式选择、地址选择等。

参考模板：`templates/CardComponent-Selection.vue.template`

关键特征：
- 网格布局展示选项
- 点击选项 emit `@select`
- 底部有"取消"链接

### 表单型卡片（Form Card）

适用于：基本信息填写、订单头设置等。

参考模板：`templates/CardComponent-Form.vue.template`

关键特征：
- 渐变头部 + 可滚动表单区域
- 底部有"取消"和"确认"按钮对
- 确认时 emit `@confirm` 带表单数据

### 列表型卡片（List Card）

适用于：订单列表、提货单列表等。

参考模板：`templates/CardComponent-Selection.vue.template`（列表型同理，改为竖向排列）

关键特征：
- 渐变头部 + 记录数显示
- 列表项可点击 emit `@viewDetail`
- 底部有"关闭"按钮
- 支持 `readonly` prop（只读模式）
