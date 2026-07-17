<script setup lang="ts">
import { onMounted, onUnmounted, provide } from 'vue'
import { createCardRegistry } from '../registry/createCardRegistry'
import { CARD_REGISTRY_KEY, CHAT_CONFIG_KEY } from '../registry/symbols'
import type { ChatConfig } from './types'
import '../styles/theme.css'

const props = defineProps<{
  config: ChatConfig
}>()

const registry = createCardRegistry(props.config.cards)

provide(CARD_REGISTRY_KEY, registry)
provide(CHAT_CONFIG_KEY, props.config)

onMounted(() => {
  document.documentElement.classList.add('chat-theme')
})

onUnmounted(() => {
  document.documentElement.classList.remove('chat-theme')
})
</script>

<template>
  <slot />
</template>
