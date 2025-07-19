import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoI18n from '../src/index'

// 语言包配置
const locale = {
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
  }
}

export default defineConfig({
  plugins: [
    vue(),
    autoI18n(locale, {
      // 启用脚本转换
      enableScript: true,
      // 启用模板转换
      enableTemplate: true,
      // 排除文件
      exclude: [
        'node_modules',
        /\.test\.vue$/,
        'src/components/legacy'
      ],
      // 自定义匹配器（优先级高于语言包匹配）
      customMatcher: (text) => {
        // 可以在这里添加自定义匹配逻辑
        // 例如：将特定文本映射到特定的 key
        if (text === 'Hello World') return 'custom.hello'
        return false
      },
      // 自定义 key 生成器（当没有匹配到语言包时使用）
      keyGenerator: (text) => {
        // 生成自动的 key，例如：'Hello World' -> 'auto.hello_world'
        return `auto.${text.toLowerCase().replace(/\s+/g, '_')}`
      },
      // 启用调试模式
      debug: true
    })
  ],
  server: {
    port: 3000,
    open: true
  }
}) 
