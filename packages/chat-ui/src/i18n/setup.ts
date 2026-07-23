import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './en.json'
import zh from './zh.json'

/**
 * Auto-register vue-i18n on the app if not already installed.
 *
 * Uses bundled en/zh locales. If the consumer already has i18n set up,
 * this is a no-op — existing configuration is preserved.
 */
export function ensureI18n(app: App) {
  // Check if i18n is already installed
  if (app.config.globalProperties.$i18n) {
    return
  }

  const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'en',
    messages: { en, zh },
  })

  app.use(i18n)
}
