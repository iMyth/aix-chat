import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import 'aix-chat/style.css';
import { en, zh } from 'aix-chat';
import App from './App.vue';
const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'en',
    messages: { en, zh },
});
createApp(App).use(i18n).mount('#app');
