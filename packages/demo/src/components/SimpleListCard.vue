<script setup lang="ts">
/**
 * Demo: Simple list card.
 * Represents the pattern of cards like OrderListCard, PickListCard.
 */
const props = defineProps<{
  title?: string
  records?: Array<{ id: string; title: string; subtitle?: string; status?: string; statusColor?: string }>
  total?: number
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'viewDetail', item: { id: string; title: string }): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="simple-list-card">
    <div class="card-header">
      <div class="card-title-text">{{ title || '列表' }}</div>
      <div class="card-subtitle-text">共 {{ total ?? records?.length ?? 0 }} 条记录</div>
    </div>
    <div class="card-body">
      <div v-if="!records?.length" class="empty-text">暂无数据</div>
      <div
        v-for="record in records"
        :key="record.id"
        class="list-item"
        @click="!readonly && emit('viewDetail', { id: record.id, title: record.title })"
      >
        <div class="item-main">
          <span class="item-title">{{ record.title }}</span>
          <span v-if="record.subtitle" class="item-subtitle">{{ record.subtitle }}</span>
        </div>
        <span v-if="record.status" class="item-status" :style="{ color: record.statusColor || 'var(--text-secondary)' }">{{ record.status }}</span>
      </div>
    </div>
    <div v-if="!readonly" class="card-actions">
      <button class="close-btn" @click="emit('close')">关闭</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'aix-chat/styles/chat-card';
.simple-list-card { @include chat-card.card-base; }
.card-header { @include chat-card.card-header; }
.card-title-text { @include chat-card.card-title; margin: 0; }
.card-subtitle-text { @include chat-card.card-subtitle; }
.card-body { @include chat-card.card-content; display: flex; flex-direction: column; gap: 8px; }
.empty-text { text-align: center; color: var(--text-tertiary); padding: 20px 0; font-size: 14px; }
.list-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-container); border: 1px solid var(--border-light); border-radius: 10px; cursor: pointer; transition: all 0.2s; &:hover { border-color: var(--primary-color); box-shadow: var(--shadow-sm); transform: translateY(-1px); } }
.item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.item-title { font-size: 14px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-subtitle { font-size: 12px; color: var(--text-secondary); }
.item-status { font-size: 12px; font-weight: 500; flex-shrink: 0; }
.card-actions { @include chat-card.card-actions; }
.close-btn { padding: 6px 16px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-hover); color: var(--text-secondary); cursor: pointer; font-size: 13px; transition: all 0.2s; &:hover { background: var(--bg-active); color: var(--text-primary); } }
</style>
