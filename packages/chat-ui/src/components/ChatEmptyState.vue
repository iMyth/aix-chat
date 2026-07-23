<script setup lang="ts">
import { useChatI18n } from '../i18n/useChatI18n'
import { computed } from 'vue'

const { t } = useChatI18n()
const props = defineProps<{
  title?: string
  description?: string
}>()
const displayTitle = computed(() => props.title ?? t('ai_chat_empty_state_startConversation'))
const displayDescription = computed(() => props.description ?? t('ai_chat_empty_state_askAnyQuestion'))
</script>

<template>
  <div class="empty-state">
    <IconMdiChatOutline class="empty-icon" />
    <h3 class="empty-title">{{ displayTitle }}</h3>
    <p class="empty-description">{{ displayDescription }}</p>
  </div>
</template>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px 20px; text-align: center; color: var(--text-primary); }
.empty-icon { width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.5; animation: float 3s ease-in-out infinite; color: var(--primary-color); }
.empty-title { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
.empty-description { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@media (max-width: 768px) {
  .empty-state { padding: 20px; }
  .empty-icon { width: 48px; height: 48px; }
  .empty-title { font-size: 20px; }
}
</style>
