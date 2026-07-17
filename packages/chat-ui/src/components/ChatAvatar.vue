<script setup lang="ts">
import { computed, inject } from 'vue'
import { CHAT_CONFIG_KEY } from '../registry/symbols'
import type { ChatConfig } from '../config/types'

const props = withDefaults(defineProps<{
  type?: 'assistant' | 'user'
  size?: number
}>(), {
  type: 'assistant',
  size: 36,
})

const config = inject<ChatConfig>(CHAT_CONFIG_KEY)

const avatarUrl = computed(() => {
  if (props.type === 'assistant') return config?.avatar.assistantAvatar || ''
  return config?.avatar.userAvatar || ''
})
</script>

<template>
  <div class="avatar" :class="type === 'assistant' ? 'ai-avatar' : 'user-avatar'" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
    <IconMdiRobot v-else-if="type === 'assistant'" class="avatar-icon" />
    <IconMdiAccount v-else class="avatar-icon" />
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-secondary, #f0f2f5);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-icon { width: 55%; height: 55%; color: var(--text-secondary); }

.ai-avatar {
  background: linear-gradient(135deg, #667eea22 0%, #248bfb22 100%);
}

.user-avatar {
  background: linear-gradient(135deg, #10b98122 0%, #059669aa 100%);
}
</style>
