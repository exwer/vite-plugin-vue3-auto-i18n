import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const messages = {
  en: {
    message: {
      hello: 'hello world',
    },
  },
  ch: {
    message: {
      hello: '你好，世界',
    },
  },
}

const i18n = createI18n({
  locale: 'ch', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
  // If you need to specify other options, you can set other options
  // ...
})

createApp(App).use(i18n).mount('#app')
