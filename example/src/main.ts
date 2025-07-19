import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const messages = {
  en: {
    hello: 'Hello World',
    welcome: 'Welcome',
    name: 'Name',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success!',
    cancel: 'Cancel',
    confirm: 'Confirm'
  },
  zh: {
    hello: '你好世界',
    welcome: '欢迎',
    name: '姓名',
    submit: '提交',
    loading: '加载中...',
    error: '发生错误',
    success: '成功！',
    cancel: '取消',
    confirm: '确认'
  }
}

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages
})

createApp(App).use(i18n).mount('#app')
