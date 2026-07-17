<script setup lang="ts">
/**
 * Demo: Generic option selector card.
 * Represents the pattern of cards like SalesUnitCard, DeliveryCard, etc.
 */
const props = defineProps<{
  title?: string
  options?: Array<{ label: string; value: string; icon?: string; description?: string }>
}>()

const emit = defineEmits<{
  (e: 'select', item: { label: string; value: string }): void
  (e: 'cancel'): void
}>()

/** Map value to MDI icon name for built-in option types */
const iconMap: Record<string, string> = {
  new_order: 'mdi-cart',
  query_order: 'mdi-package-variant',
  fill_info: 'mdi-clipboard-text-outline',
  help: 'mdi-help-circle-outline',
}

function getIcon(value: string): string | null {
  return iconMap[value] ?? null
}

function handleSelect(item: { label: string; value: string }) {
  emit('select', item)
}
</script>

<template>
  <div class="option-selector-card">
    <div v-if="title" class="card-title">{{ title }}</div>
    <div class="card-grid">
      <div
        v-for="item in options"
        :key="item.value"
        class="card-item"
        @click="handleSelect(item)"
      >
        <component
          :is="getIcon(item.value)"
          v-if="getIcon(item.value)"
          class="card-icon"
        />
        <span class="card-label">{{ item.label }}</span>
        <span v-if="item.description" class="card-desc">{{ item.description }}</span>
      </div>
    </div>
    <div class="card-cancel" @click="emit('cancel')">取消</div>
  </div>
</template>

<style scoped lang="scss">
@use 'aix-chat/styles/chat-card';
.option-selector-card { @include chat-card.selector-card-base; }
.card-title { @include chat-card.selector-title; }
.card-grid { @include chat-card.selector-grid; }
.card-item { @include chat-card.selector-item; }
.card-icon { width: 28px; height: 28px; color: var(--primary-color); }
.card-label { @include chat-card.selector-label; }
.card-desc { font-size: 12px; color: var(--text-secondary); text-align: center; margin-top: 2px; }
.card-cancel { text-align: center; margin-top: 12px; font-size: 13px; color: var(--text-tertiary); cursor: pointer; &:hover { color: var(--text-secondary); } }
</style>
