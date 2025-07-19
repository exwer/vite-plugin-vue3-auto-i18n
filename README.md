# vite-plugin-vue3-auto-i18n

[![NPM version](https://img.shields.io/npm/v/vite-plugin-vue3-auto-i18n?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-vue3-auto-i18n)
[![License](https://img.shields.io/npm/l/vite-plugin-vue3-auto-i18n)](https://github.com/love-js/vite-plugin-vue3-auto-i18n/blob/main/LICENSE)

> ⚠️ **Beta Version**: This plugin is still in beta. Please report any issues you encounter.

A Vite plugin that automatically imports Vue-i18n and replaces internationalized strings in Vue 3 Single File Components (SFC).

## ✨ Features

- 🔄 **Auto Import**: Automatically imports `useI18n` and `$t` in Vue SFC files
- 🎯 **Smart Matching**: Intelligently matches strings against your i18n configuration
- 📝 **Script Transformation**: 
  - Replaces `ref('xxx')` with `ref(t('xxx'))`
  - Replaces `'xxx'` with `computed(() => t('xxx'))`
  - Handles array/object literals: `['xxx', ...]` → `[t('xxx'), ...]`
- 🎨 **Template Transformation**:
  - Replaces plain text nodes: `xxx` → `{{ $t('xxx') }}`
  - Replaces attribute values: `placeholder="xxx"` → `:placeholder="$t('xxx')"`
  - Replaces dynamic bindings: `:placeholder="'xxx'"` → `:placeholder="$t('xxx')"`
  - Replaces interpolations: `{{ 'xxx' }}` → `{{ $t('xxx') }}`
- ⚙️ **Flexible Configuration**: Custom matchers, key generators, and exclusions
- 🛡️ **Error Handling**: Friendly error messages for syntax errors
- 🐛 **Debug Mode**: Detailed transformation logging

## 📦 Installation

```bash
npm install -D vite-plugin-vue3-auto-i18n
```

## 🚀 Quick Start

### 1. Setup Vue-i18n

First, ensure you have [vue-i18n](https://vue-i18n.intlify.dev/) installed and configured:

```typescript
// main.ts
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const messages = {
  en: {
    message: {
      hello: 'Hello World',
      welcome: 'Welcome',
      placeholder: 'Enter your name'
    }
  },
  zh: {
    message: {
      hello: '你好世界',
      welcome: '欢迎',
      placeholder: '请输入您的姓名'
    }
  }
}

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages
})

createApp(App).use(i18n).mount('#app')
```

### 2. Configure Vite Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoI18n from 'vite-plugin-vue3-auto-i18n'

export default defineConfig({
  plugins: [
    vue(),
    autoI18n(messages.en) // Pass your locale messages
  ]
})
```

> **Important**: This plugin should be placed **after** the Vue plugin and any other Vue-related plugins.

### 3. Write Your Code

Write your Vue components as usual:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('Hello World')
const options = ['Welcome', 'Hello World']
</script>

<template>
  <div>Hello World</div>
  <input placeholder="Enter your name" />
  <input :placeholder="'Enter your name'" />
  <div>{{ 'Hello World' }}</div>
</template>
```

### 4. Automatic Transformation

The plugin will automatically transform your code:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const title = ref(t('message.hello'))
const options = [t('message.welcome'), t('message.hello')]
</script>

<template>
  <div>{{ $t('message.hello') }}</div>
  <input :placeholder="$t('message.placeholder')" />
  <input :placeholder="$t('message.placeholder')" />
  <div>{{ $t('message.hello') }}</div>
</template>
```

## ⚙️ Configuration

### Plugin Options

```typescript
interface AutoI18nOptions {
  enableScript?: boolean        // Enable script transformation (default: true)
  enableTemplate?: boolean      // Enable template transformation (default: true)
  exclude?: (string | RegExp)[] // Exclude files by path or pattern
  customMatcher?: (text: string) => string | false // Custom match function
  keyGenerator?: (text: string) => string // Custom key generator
  debug?: boolean               // Enable debug logging (default: false)
}
```

### Configuration Examples

#### Basic Configuration

```typescript
import autoI18n from 'vite-plugin-vue3-auto-i18n'

export default defineConfig({
  plugins: [
    autoI18n(locale, {
      enableScript: true,
      enableTemplate: true,
      debug: false
    })
  ]
})
```

#### Advanced Configuration

```typescript
import autoI18n from 'vite-plugin-vue3-auto-i18n'

export default defineConfig({
  plugins: [
    autoI18n(locale, {
      // Custom key generator
      keyGenerator: (text) => `auto.${text.replace(/\s+/g, '_')}`,
      
      // Custom matcher (higher priority than locale matching)
      customMatcher: (text) => {
        if (text === 'Hello World') return 'custom.hello'
        return false
      },
      
      // Exclude specific files
      exclude: [
        'node_modules',
        /\.test\.vue$/,
        'src/components/legacy'
      ],
      
      // Enable debug mode
      debug: true
    })
  ]
})
```

## 🔧 Usage Examples

### Script Transformations

```vue
<script setup>
// Before transformation
const message = ref('Hello World')
const greeting = 'Welcome'
const items = ['Hello World', 'Welcome']
const config = { title: 'Hello World', subtitle: 'Welcome' }

// After transformation
const message = ref(t('message.hello'))
const greeting = computed(() => t('message.welcome'))
const items = [t('message.hello'), t('message.welcome')]
const config = { title: t('message.hello'), subtitle: t('message.welcome') }
</script>
```

### Template Transformations

```vue
<template>
  <!-- Before transformation -->
  <div>Hello World</div>
  <input placeholder="Enter your name" />
  <input :placeholder="'Enter your name'" />
  <div>{{ 'Hello World' }}</div>
  
  <!-- After transformation -->
  <div>{{ $t('message.hello') }}</div>
  <input :placeholder="$t('message.placeholder')" />
  <input :placeholder="$t('message.placeholder')" />
  <div>{{ $t('message.hello') }}</div>
</template>
```

## 🛡️ Error Handling

The plugin provides comprehensive error handling with friendly messages:

### Template Syntax Errors

```bash
[auto-i18n] template parse error in Component.vue: Element is missing end tag.
```

### Script Syntax Errors

```bash
[auto-i18n] script parse error in Component.vue: Unexpected token
```

### Configuration Errors

```bash
[auto-i18n] invalid locale configuration: locale must be a non-empty object
```

### Warnings

```bash
[auto-i18n] warning: No template found in Component.vue
[auto-i18n] warning: No script found in Component.vue
```

### Debug Information

```bash
[auto-i18n] transformed: Component.vue
```

## ❌ Limitations

The following scenarios are **not supported**:

- **Complex Expressions**: 
  ```vue
  {{ 'Hello' + name }}           <!-- ❌ -->
  :placeholder="foo ? 'Hello' : 'Hi'"  <!-- ❌ -->
  ```

- **Slot Content**: 
  ```vue
  <template #header>Hello World</template>  <!-- ❌ -->
  ```

- **Directive Arguments**: 
  ```vue
  v-tooltip="'Hello World'"      <!-- ❌ -->
  v-on:click="'Hi'"              <!-- ❌ -->
  ```

- **Component Names & Props**: 
  ```vue
  <MyComponent title="Hello" />  <!-- ❌ -->
  ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](./LICENSE) License © 2022 [love-JS](https://github.com/love-js)
