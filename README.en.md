# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)

> 🚀 **i18ncraft** is a CLI tool for automated batch internationalization of Vue 3 projects. It efficiently scans and transforms .vue files, replacing text and attributes for multi-language development.

---

## ✨ Features

- ⚡ **Batch Scan & Transform**: Recursively scan all .vue files in a directory, automatically replace text with $t('key') calls
- 🧩 **Config-Driven**: Flexible config file for scan directory, output directory, locale, etc.
- 📝 **Script & Template Support**: Transforms both <template> and <script setup> string literals
- 🛡️ **Robust Error Handling**: Detailed syntax/config error messages for easy debugging
- 🧪 **Comprehensive Testing**: Built-in Vitest tests ensure reliable transformation logic
- 🐾 **Preserve Directory Structure**: Output mirrors source structure for easy integration

---

## 📦 Installation

```bash
npm install -D i18ncraft
# or
pnpm add -D i18ncraft
```

---

## 🚀 Quick Start

### 1. Create Config File

Create `i18ncraft.config.js` in your project root:

```js
module.exports = {
  scanDir: 'src',           // Directory to scan (required)
  outDir: 'i18n_out',       // Output directory (required)
  exts: ['.vue'],           // Only .vue files supported
  locale: {
    en: {
      message: { hello: 'Hello World', hi: 'Hi', nested: { greet: 'Greetings' } },
      plain: 'plain',
    },
    zh: {
      message: { hello: '你好，世界', hi: '嗨', nested: { greet: '问候' } },
      plain: '纯文本',
    }
  }
}
```

### 2. Run Batch Transformation

```bash
npx i18ncraft
```

- The tool will read the config, recursively scan all .vue files in `scanDir`, transform them, and output to `outDir` with the same structure.

---

## ⚙️ Config Options

| Field    | Type     | Description                        | Required |
|----------|----------|------------------------------------|----------|
| scanDir  | string   | Directory to scan                  | Yes      |
| outDir   | string   | Output directory                   | Yes      |
| exts     | string[] | File extensions, only ['.vue']     | Yes      |
| locale   | object   | Locale message object              | Yes      |

---

## 📝 Example

### Source: src/Hello.vue
```vue
<script setup>
const arr = ['hello world', 'hi', 'notMatch']
const obj = { a: 'hello world', b: 'hi', c: 'notMatch' }
</script>
<template>
  <input placeholder="hello world" />
  <div>{{ 'hi' }}</div>
  <div>{{ obj.a }}</div>
</template>
```

### Output: i18n_out/Hello.vue
```vue
<script setup>
const arr = [$t('message.hello'), $t('message.hi'), 'notMatch']
const obj = {
  a: $t('message.hello'),
  b: $t('message.hi'),
  c: 'notMatch'
}
</script>
<template>
  <input :placeholder="$t('message.hello')" />
  <div>{{ $t('message.hi') }}</div>
  <div>{{ obj.a }}</div>
</template>
```

---

## 🛡️ Error Handling

- **Template Syntax Errors**: Detailed errors for missing tags, etc.
- **Script Syntax Errors**: Pinpoint unexpected tokens
- **Config Errors**: Missing scanDir, outDir, exts, or locale will throw

---

## 🧪 Testing

Vitest tests are included, covering all transformation logic and edge cases for stable releases.

```bash
pnpm exec vitest run
```

---

## 📄 License

[MIT](./LICENSE)

---

## 🙋 FAQ

- **Q: What file types are supported?**
  Only .vue files for now, more in the future.
- **Q: Will output overwrite my source files?**
  No, all results go to outDir, source files are untouched.
- **Q: Can I customize key generation or matching?**
  Yes, via locale config and future extensions.

---

For more questions or suggestions, please open an [issue on GitHub](https://github.com/exwer/i18ncraft/issues)! 

---

## ⚠️ Notes

- The CLI will automatically insert `import { computed } from 'vue'` if needed, so you don't have to import it manually.
- However, you must ensure that `useI18n` is imported and $t is available in your script.
- Array/object literal i18n strings are now automatically wrapped with computed for reactivity on locale change.

--- 
