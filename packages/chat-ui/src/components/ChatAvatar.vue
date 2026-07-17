<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'assistant' | 'user'
    size?: number
    /** Custom assistant avatar URL */
    assistantAvatar?: string
    /** Custom user avatar URL */
    userAvatar?: string
  }>(),
  {
    type: 'assistant',
    size: 36,
    assistantAvatar: '',
    userAvatar: '',
  },
)
</script>

<template>
  <div class="avatar" :class="type === 'assistant' ? 'ai-avatar' : 'user-avatar'" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="type === 'assistant' && assistantAvatar" :src="assistantAvatar" class="avatar-img" />
    <img v-else-if="type === 'user' && userAvatar" :src="userAvatar" class="avatar-img" />
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
