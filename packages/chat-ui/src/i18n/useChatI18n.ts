import { createI18n, useI18n } from 'vue-i18n'
import en from './en.json'
import zh from './zh.json'

// Shared fallback i18n instance — used when the consumer app doesn't have vue-i18n installed
let fallbackInstance: ReturnType<typeof createI18n> | null = null

function getFallbackI18n() {
  if (!fallbackInstance) {
    fallbackInstance = createI18n({
      legacy: false,
      locale: 'zh',
      fallbackLocale: 'en',
      messages: { en, zh },
    })
  }
  return fallbackInstance.global
}

/**
 * Safe i18n composable for internal components.
 *
 * Returns `{ t }` — a consistent interface regardless of whether
 * the consumer app has vue-i18n installed or not.
 */
export function useChatI18n(): { t: (key: string, ...args: any[]) => string } {
  try {
    const instance = useI18n({ useScope: 'global' })
    return { t: instance.t as any }
  } catch {
    // Consumer app doesn't have i18n — use built-in fallback
    return { t: getFallbackI18n().t as any }
  }
}
