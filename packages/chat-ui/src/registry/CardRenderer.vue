<script setup lang="ts">
import { computed } from 'vue'
import { useCardRegistry } from './useCardRegistry'

const props = defineProps<{
  /** 'pending' for interactive cards, 'completed' for readonly tool results */
  mode: 'pending' | 'completed'
  /** For pending: the result type string. For completed: the tool name. */
  type: string
  /** Data to pass as props to the card component */
  data?: Record<string, unknown>
}>()

const emit = defineEmits<{
  /** Forwarded from the card component — wraps all card events */
  (e: 'cardEvent', payload: { eventName: string; cardType: string; data: unknown }): void
  /** Request parent to scroll chat to bottom */
  (e: 'scrollToBottom'): void
}>()

const registry = useCardRegistry()

const cardComponent = computed(() => {
  if (props.mode === 'pending') {
    return registry.getPendingComponent(props.type)
  }
  return registry.getCompletedComponent(props.type)
})

/**
 * Cards emit semantic events (select, cancel, confirm, etc).
 * CardRenderer wraps them into a unified cardEvent shape.
 */
function handleCardEvent(eventName: string, data: unknown) {
  emit('cardEvent', { eventName, cardType: props.type, data })
}
</script>

<template>
  <component
    v-if="cardComponent"
    :is="cardComponent"
    v-bind="data ?? {}"
    @select="(d: unknown) => handleCardEvent('select', d)"
    @cancel="handleCardEvent('cancel', undefined)"
    @confirm="(d: unknown) => handleCardEvent('confirm', d)"
    @close="handleCardEvent('close', undefined)"
    @view-detail="(d: unknown) => handleCardEvent('viewDetail', d)"
    @scroll-to-bottom="emit('scrollToBottom')"
  />
  <div v-else class="unknown-card">
    <span>Unknown card type: {{ type }}</span>
  </div>
</template>

<style scoped>
.unknown-card {
  padding: 12px 16px;
  color: var(--text-tertiary, #9ca3af);
  font-size: 13px;
  text-align: center;
  border: 1px dashed var(--border-light, #e5e7eb);
  border-radius: 8px;
}
</style>
