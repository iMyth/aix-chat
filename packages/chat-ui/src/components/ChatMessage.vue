<script setup lang="ts">
import { useChatI18n } from '../i18n/useChatI18n'
import { inject, computed, ref } from 'vue'

import MarkdownRenderer from './MarkdownRenderer.vue'
import CardRenderer from '../registry/CardRenderer.vue'
import ChatAvatar from './ChatAvatar.vue'
import { CHAT_CONFIG_KEY } from '../registry/symbols'
import type { ChatConfig } from '../config/types'

const { t } = useChatI18n()

const props = defineProps<{
  message: Record<string, any>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'quickReply', text: string): void
  (e: 'cardEvent', payload: { eventName: string; cardType: string; data: unknown }): void
}>()

const config = inject<ChatConfig>(CHAT_CONFIG_KEY)

const quickReplies = computed(() => props.message.data?.quickReplies || [])
const handleQuickReply = (item: { label: string; value: string }) => emit('quickReply', item.value)

const messageParts = computed(() => {
  if (Array.isArray(props.message.parts)) return props.message.parts
  if (Array.isArray(props.message.content)) return props.message.content
  if (typeof props.message.content === 'string') return [{ type: 'text', text: props.message.content }]
  return []
})

const isImagePart = (part: any) =>
  part.type === 'image' || (part.type === 'file' && part.mediaType?.startsWith('image/'))
const isTextPart = (part: any) => part.type === 'text'
const isReasoningPart = (part: any) => part.type === 'reasoning'
const isToolCallPart = (part: any) => {
  if (part.type === 'tool-call' || part.type === 'tool-result') return true
  return typeof part.type === 'string' && part.type.startsWith('tool-')
}

const getImageUrl = (part: any) => part.image || part.data || part.url || ''

const getToolName = (part: any) => {
  if (part.type === 'tool-call' || part.type === 'tool-result') return part.toolName || 'unknown'
  return part.type.slice(5)
}

const getToolDisplayName = (part: any) => {
  const name = getToolName(part)
  const i18nKey = config?.toolDisplayNames?.[name]
  return i18nKey ? t(i18nKey) : name
}

/**
 * Check if a completed tool result should render as a business card.
 * Uses the registry's completed mapping.
 */
function getCompletedCardToolName(part: any): string | null {
  if (!isToolCallPart(part) || part.state !== 'output-available') return null
  const toolName = getToolName(part)
  if (!config?.cards?.completed?.[toolName]) return null
  return toolName
}

function getToolResultData(part: any) {
  return part.output?.data || {}
}

function handleCompletedCardEvent({ eventName, cardType, data }: { eventName: string; cardType: string; data: unknown }) {
  // For completed cards, view-detail triggers a quick reply
  if (eventName === 'viewDetail') {
    const detail = data as any
    const query = detail?.orderNo || detail?.pickCode || ''
    if (query) emit('quickReply', query)
  }
}

const reasoningCollapsed = ref<Record<number, boolean>>({})
const toggleReasoning = (index: number) => {
  reasoningCollapsed.value[index] = !reasoningCollapsed.value[index]
}
const isCollapsed = (index: number) => reasoningCollapsed.value[index] !== false

// 从 config 读取配置
const enableReasoning = config?.ui.enableReasoning ?? true
</script>

<template>
  <div class="message-wrapper" :class="message.role === 'user' ? 'user-wrapper' : 'assistant-wrapper'">
    <ChatAvatar :type="message.role === 'user' ? 'user' : 'assistant'" />

    <div class="message-bubble" :class="message.role === 'user' ? 'user-bubble' : 'assistant-bubble'">
      <div class="message-content">
        <div v-for="(part, partIndex) in messageParts" :key="`${message.id}-${part.type}-${partIndex}`">
          <!-- Reasoning block -->
          <div v-if="enableReasoning && isReasoningPart(part) && message.role === 'assistant'" class="reasoning-block">
            <button class="reasoning-toggle" @click="toggleReasoning(partIndex)">
              <IconMdiBrain class="reasoning-icon" />
              <span class="reasoning-label">Thinking...</span>
              <span class="reasoning-chevron" :class="{ collapsed: isCollapsed(partIndex) }">▾</span>
            </button>
            <div class="reasoning-body" :class="{ hidden: isCollapsed(partIndex) }">
              <MarkdownRenderer :content="part.text" class="reasoning-text" />
            </div>
          </div>

          <!-- Text -->
          <MarkdownRenderer v-else-if="isTextPart(part) && message.role === 'assistant'" :content="part.text" class="text-content" />
          <div v-else-if="isTextPart(part) && message.role === 'user'">{{ part.text }}</div>

          <!-- Image -->
          <div v-else-if="isImagePart(part)" class="image-content">
            <el-image :src="getImageUrl(part)" :preview-src-list="[getImageUrl(part)]" fit="cover" class="message-image" :preview-teleported="true" loading="lazy" />
          </div>

          <!-- Tool call -->
          <div v-else-if="isToolCallPart(part)" class="tool-call-content">
            <!-- Completed tool result → render as business card via registry -->
            <CardRenderer
              v-if="getCompletedCardToolName(part)"
              mode="completed"
              :type="getCompletedCardToolName(part)!"
              :data="{ detail: getToolResultData(part), readonly: true, disabled }"
              @card-event="handleCompletedCardEvent"
            />
            <!-- Generic tool indicator -->
            <div v-else class="tool-call-indicator">
              <IconMdiCog class="tool-call-icon" />
              <span class="tool-call-label">{{ getToolDisplayName(part) }}</span>
            </div>
          </div>
        </div>

        <!-- Quick replies -->
        <div v-if="quickReplies.length" class="quick-replies">
          <button v-for="(item, idx) in quickReplies" :key="idx" class="quick-reply-btn" @click="handleQuickReply(item)">{{ item.label }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-wrapper { display: flex; gap: 12px; align-items: flex-end; animation: fadeInUp 0.3s ease-out; }
.user-wrapper { flex-direction: row-reverse; }
.assistant-wrapper { flex-direction: row; }
.message-bubble { max-width: min(600px, 85%); padding: 12px 16px; border-radius: 18px; box-shadow: var(--shadow-bubble); word-wrap: break-word; }
.user-bubble { background: var(--gradient-primary); color: white; border-bottom-right-radius: 4px; }
.assistant-bubble { background: var(--bg-container); color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--border-light); box-shadow: var(--shadow-bubble); }
.message-content { display: flex; flex-direction: column; gap: 8px; }

.reasoning-block { border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; background: var(--bg-secondary, #f9fafb); border-left: 3px solid var(--primary-color); }
.reasoning-toggle { width: 100%; display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: transparent; border: none; cursor: pointer; font-size: 13px; color: var(--text-secondary, #6b7280); text-align: left; transition: background 0.15s; }
.reasoning-toggle:hover { background: var(--bg-hover, #f3f4f6); }
.reasoning-icon { width: 14px; height: 14px; color: var(--text-secondary); flex-shrink: 0; }
.reasoning-label { flex: 1; font-weight: 500; letter-spacing: 0.01em; }
.reasoning-chevron { font-size: 16px; transition: transform 0.2s ease; display: inline-block; }
.reasoning-chevron.collapsed { transform: rotate(-90deg); }
.reasoning-body { padding: 10px 14px; border-top: 1px solid var(--border-light); transition: all 0.2s ease; }
.reasoning-body.hidden { display: none; }
.reasoning-text { font-size: 13px; line-height: 1.65; color: var(--text-secondary, #6b7280); opacity: 0.9; }

.text-content { white-space: pre-wrap; color: inherit; }
.image-content { margin-top: 8px; }
.message-image { max-width: 100%; border-radius: 8px; border: 1px solid var(--border-light); overflow: hidden; }
.message-image :deep(.el-image__inner) { max-height: 300px; object-fit: cover; display: block; }

.tool-call-content { margin-top: 4px; }
.tool-call-indicator { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 16px; font-size: 12px; color: var(--text-tertiary); }
.tool-call-icon { width: 12px; height: 12px; color: var(--text-tertiary); flex-shrink: 0; }
.tool-call-label { font-weight: 500; white-space: nowrap; }

.quick-replies { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.quick-reply-btn { padding: 8px 16px; border-radius: 18px; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); font-size: 14px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.quick-reply-btn:hover { background: var(--primary-color); color: #fff; }
.quick-reply-btn:active { transform: scale(0.95); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .message-wrapper { flex-direction: column !important; align-items: flex-start; gap: 6px; }
  .user-wrapper { align-items: flex-end !important; }
  .message-bubble { max-width: 100%; min-width: 0; }
  .assistant-bubble { border-bottom-left-radius: 18px; border-top-left-radius: 18px; }
  .user-bubble { border-bottom-right-radius: 18px; border-top-right-radius: 18px; }
  .message-image :deep(.el-image__inner) { max-height: 200px; }
}
</style>
