<script setup lang="ts">
import { ref, watch } from 'vue'
import ChatAvatar from './ChatAvatar.vue'
import ChatEmptyState from './ChatEmptyState.vue'
import ChatMessage from './ChatMessage.vue'
import CardRenderer from '../registry/CardRenderer.vue'
import { useAutoScroll } from '../composables/useAutoScroll'

const props = defineProps<{
  messages: any[]
  isLoading?: boolean
  pendingToolCall?: { toolCall: any; result: any } | null
}>()

const emit = defineEmits<{
  (e: 'cardEvent', payload: { eventName: string; cardType: string; data: unknown }): void
  (e: 'quickReply', text: string): void
}>()

const chatContainerRef = ref<HTMLElement | null>(null)
const { userScrolledUp, scrollToBottom, delayScrollToBottom, handleScroll } = useAutoScroll(chatContainerRef)

function handleCardEvent(payload: { eventName: string; cardType: string; data: unknown }) {
  emit('cardEvent', payload)
}

watch(() => props.messages, () => scrollToBottom(), { deep: true })
watch(
  () => [props.messages.length, props.isLoading, props.pendingToolCall],
  () => { userScrolledUp.value = false; scrollToBottom() },
)
</script>

<template>
  <div class="chat-messages-container" ref="chatContainerRef" @scroll="handleScroll">
    <ChatEmptyState v-if="!messages?.length && !pendingToolCall" />

    <div v-else class="messages-list">
      <ChatMessage
        v-for="(message, index) in messages"
        :key="message.id || index"
        :message="message"
        :disabled="!!pendingToolCall || isLoading"
        @quick-reply="(text: string) => emit('quickReply', text)"
        @card-event="handleCardEvent"
      />

      <!-- Pending interaction card (dynamic via registry) -->
      <div v-if="pendingToolCall" class="pending-interaction">
        <div class="message-wrapper assistant-wrapper">
          <ChatAvatar type="assistant" />
          <div class="pending-card-bubble">
            <CardRenderer
              mode="pending"
              :type="pendingToolCall.result?.type"
              :data="pendingToolCall.result"
              @card-event="handleCardEvent"
              @scroll-to-bottom="delayScrollToBottom"
            />
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="message-wrapper assistant-wrapper">
          <ChatAvatar type="assistant" />
          <div class="loading-bubble">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-messages-container { flex: 1; overflow-y: auto; background: var(--bg-page); position: relative; scroll-behavior: smooth; }
.chat-messages-container::-webkit-scrollbar { width: 6px; }
.chat-messages-container::-webkit-scrollbar-track { background: var(--bg-secondary); }
.chat-messages-container::-webkit-scrollbar-thumb { background: var(--border-normal); border-radius: 3px; }

.messages-list { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.pending-interaction { animation: fadeInUp 0.3s ease-out; }
.message-wrapper { display: flex; gap: 12px; align-items: flex-end; }
.assistant-wrapper { flex-direction: row; }
.message-bubble { max-width: min(600px, 85%); border-radius: 18px; box-shadow: var(--shadow-bubble); }
.assistant-bubble { background: var(--bg-container); color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--border-light); padding: 0; overflow: hidden; box-shadow: var(--shadow-bubble); }
.pending-card-bubble { max-width: min(600px, 90%); border-radius: 18px; border-bottom-left-radius: 4px; overflow: visible; }

.loading-indicator { animation: fadeIn 0.3s ease-out; }
.loading-bubble { background: var(--bg-container); padding: 12px 20px; border-radius: 18px; border-bottom-left-radius: 4px; box-shadow: var(--shadow-bubble); border: 1px solid var(--border-light); }
.loading-dots { display: flex; gap: 6px; align-items: center; }
.loading-dots span { width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

@media (max-width: 768px) {
  .messages-list { padding: 12px; gap: 12px; }
  .message-wrapper { flex-direction: column !important; align-items: flex-start; gap: 6px; }
  .message-bubble { max-width: 100%; min-width: 0; }
  .pending-card-bubble { max-width: 100%; width: 100%; }
  .assistant-bubble { border-bottom-left-radius: 18px; }
  .loading-bubble { border-bottom-left-radius: 18px; }
}
</style>
