# READ THIS FIRST!
This plugin is still in development, and is not ready for use.

# [name]

[![NPM version](https://img.shields.io/npm/v/[name]?color=a1b858&label=)](https://www.npmjs.com/package/[name])

## Introdction

**Auto import** Vue-i18n in every vue sfc files and **auto replace** i18n words in vue sfc files.

All you need to do is add this plugin to your `vite.config.js`.

## Usage

First, make sure you have added [vue-i18n](https://vue-i18n.intlify.dev/) in your project.

For example:

```typescript
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const messages = {
  en: {
    message: {
      hello: 'hello world',
      Hi: 'hi'
    },
  },
  ch: {
    message: {
      hello: '你好，世界',
      Hi: '嗨'
    },
  },
}

const i18n = createI18n({
  locale: 'ch', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
})

createApp(App).use(i18n).mount('#app')

```

Then, add this plugin to your `vite.config.js`:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18n from 'vite-plugin-vue3-i18n'

export default defineConfig({
  plugins: [vue(),VueI18n()],
})

```

write your code as usual, like:

```vue
<script setup lang="ts">
import { ref } from 'vue'
//...
</script>

<template>
  <div>hello world</div>
</template>
```

Finally,this plugin will matches all the strings in the i18n configuration and replaces them automatically.
For example,The above code will be converted to:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

//...
</script>

<template>
  <div>{{ $t('message.hello') }}</div>
</template>
```

## License

[MIT](./LICENSE) License © 2022 [love-JS](https://github.com/love-js)
