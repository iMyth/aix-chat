import { inject } from 'vue'
import { CARD_REGISTRY_KEY } from './symbols'
import type { CardRegistry } from './createCardRegistry'

export function useCardRegistry(): CardRegistry {
  const registry = inject<CardRegistry>(CARD_REGISTRY_KEY)
  if (!registry) {
    throw new Error(
      '[ai-chat-core] useCardRegistry() must be used within <AiChatProvider>. ' +
        'Wrap your chat component tree with <AiChatProvider :config="chatConfig">.',
    )
  }
  return registry
}
