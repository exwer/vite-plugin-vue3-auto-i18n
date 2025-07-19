# READ THIS FIRST!
This plugin is still in beta. Expect bugs!

# vite-plugin-vue3-auto-i18n

[![NPM version](https://img.shields.io/npm/v/vite-plugin-vue3-auto-i18n?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-vue3-auto-i18n)

## Introduction

**Auto import** Vue-i18n in every vue sfc files and **auto replace** i18n words in vue sfc files.

- replace matched reactive string variable `ref('xxx')` with `ref(t('xxx'))` in both `setup script` and `setup function`.✅
- replace matched literal string `'xxx'` with `computed(()=>t('xxx'))` in both `setup script` and `setup function`. ✅
- replace matched plain node value `xxx` with `$t('xxx')` in template. ✅
- replace matched attribute value (e.g. `placeholder="xxx"`) with `:placeholder="$t('xxx')"` in template. ✅
- replace matched dynamic attribute binding (e.g. `:placeholder="'xxx'"`) with `:placeholder="$t('xxx')"` in template. ✅
- replace matched interpolation (e.g. `{{ 'xxx' }}`) with `{{ $t('xxx') }}` in template. ✅
- replace matched string in array/object literal (e.g. `[ 'xxx', ... ]` or `{ a: 'xxx' }`) with `t('xxx')` in script. ✅
- Friendly error message when template syntax error occurs. ✅

## Installation

```shell
npm install -D vite-plugin-vue3-auto-i18n
```

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

Then, add this plugin to your `vite.config.js`.

**Load order: This plugin should come after vue plugin, if you use vite-plugin-vue-i18n, then this plugin should also come after it**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/vite-plugin-vue-i18n' // if any
import autoI18n from 'vite-plugin-vue3-autoI18n'

export default defineConfig({
  plugins: [vue(), vueI18n(), autoI18n()],
})
```

## Options

You can configure the plugin with the following options:

```ts
interface AutoI18nOptions {
  enableScript?: boolean // Enable script transform (default: true)
  enableTemplate?: boolean // Enable template transform (default: true)
  exclude?: (string | RegExp)[] // Exclude files by path or pattern
  customMatcher?: (text: string) => string | false // Custom match function
  debug?: boolean // Print debug info (default: false)
}
```

**Example:**
```js
import autoI18n from 'vite-plugin-vue3-auto-i18n'

export default defineConfig({
  plugins: [
    autoI18n(locale, {
      enableScript: true,
      enableTemplate: true,
      exclude: ['node_modules', /test\.vue$/],
      customMatcher: (txt) => txt === 'hello' ? 'custom.key' : false,
      debug: true,
    })
  ]
})
```

## Usage
write your code as usual, like:

```vue
<script setup lang="ts">
import { ref } from 'vue'
// ...
</script>

<template>
  <div>hello world</div>
  <input placeholder="hello world" />
  <input :placeholder="'hello world'" />
  <div>{{ 'hello world' }}</div>
</template>
```

Finally, this plugin will match all the strings in the i18n configuration and replace them automatically.
For example, the above code will be converted to:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// ...
</script>

<template>
  <div>{{ $t('message.hello') }}</div>
  <input :placeholder="$t('message.hello')" />
  <input :placeholder="$t('message.hello')" />
</template>
```

## Error Handling

- If your template has a syntax error, the plugin will throw a friendly error message like:
  `[auto-i18n] template parse error: ...`

## Not Supported

The following scenarios are currently NOT supported:

- Complex expressions (e.g. `{{ 'hello' + name }}`, `:placeholder="foo ? 'hello' : 'hi'"`)
- Slot content and scoped slots (e.g. `<template #header>hello world</template>`)
- Directive arguments and event modifiers (e.g. `v-tooltip="'hello world'"`, `v-on:click="'hi'"`)
- Component names, prop names, etc.

## License

[MIT](./LICENSE) License © 2022 [love-JS](https://github.com/love-js)
