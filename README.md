# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)

> 🚀 **i18ncraft** - Professional internationalization automation tool with intelligent batch text transformation and enterprise-grade error handling.

<div align="center">
  <a href="README.zh.md">📖 中文文档</a>
</div>

## ⚠️ Development Status

**This project is currently under active development and is NOT recommended for production use.**

- Core functionality is implemented and tested
- API may change in future releases
- Some advanced features are still in development

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Core Features](#core-features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [TODO List](#todo-list)
- [Contributing](#contributing)

## 🚀 Quick Start

### 1. Installation

```bash
npm install -D i18ncraft
```

### 2. Create Configuration

```js
// i18ncraft.config.js
module.exports = {
  scanDir: 'src',
  outDir: 'i18n_out',
  exts: ['.vue'],
  locale: {
    en: {
      message: { 
        hello: 'Hello World', 
        welcome: 'Welcome to our application',
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel',
          save: 'Save Changes'
        },
        errors: {
          required: 'This field is required',
          invalid: 'Invalid input format'
        }
      }
    },
    zh: {
      message: { 
        hello: '你好世界', 
        welcome: '欢迎使用我们的应用',
        buttons: {
          submit: '提交',
          cancel: '取消',
          save: '保存更改'
        },
        errors: {
          required: '此字段为必填项',
          invalid: '输入格式无效'
        }
      }
    }
  }
}
```

### 3. Transform Your Files

```bash
npx i18ncraft
```

**Before transformation:**
```vue
<script setup>
const pageTitle = 'hello'
const buttonLabels = ['submit', 'cancel']
const errorMessages = {
  required: 'required',
  invalid: 'invalid'
}
</script>

<template>
  <div class="app">
    <h1>{{ pageTitle }}</h1>
    <p>welcome</p>
    
    <form>
      <input placeholder="Enter your name" />
      <div class="error">{{ errorMessages.required }}</div>
      
      <div class="buttons">
        <button>{{ buttonLabels[0] }}</button>
        <button>{{ buttonLabels[1] }}</button>
      </div>
    </form>
  </div>
</template>
```

**After transformation:**
```vue
<script setup>
import { computed } from 'vue'

const pageTitle = computed(() => $t('message.hello'))
const buttonLabels = [
  computed(() => $t('message.buttons.submit')),
  computed(() => $t('message.buttons.cancel'))
]
const errorMessages = computed(() => ({
  required: $t('message.errors.required'),
  invalid: $t('message.errors.invalid')
}))
</script>

<template>
  <div class="app">
    <h1>{{ pageTitle }}</h1>
    <p>{{ $t('message.welcome') }}</p>
    
    <form>
      <input :placeholder="$t('message.placeholder.name')" />
      <div class="error">{{ errorMessages.required }}</div>
      
      <div class="buttons">
        <button>{{ buttonLabels[0] }}</button>
        <button>{{ buttonLabels[1] }}</button>
      </div>
    </form>
  </div>
</template>
```

## ✨ Core Features

- **Vue SFC Support**: Transform `<template>` and `<script setup>` sections
- **Batch Processing**: Recursive directory scanning with preserved structure
- **Smart Matching**: Automatic i18n key generation with nested object support
- **Type Safety**: Complete TypeScript support
- **Error Handling**: Detailed error messages and recovery suggestions
- **Test Coverage**: 45+ test cases ensuring reliability

## 📦 Installation

### Requirements

- Node.js >= 16.0.0
- TypeScript >= 4.5 (recommended)

### Install

```bash
npm install -D i18ncraft
```

## 📖 Usage

### Basic Configuration

```js
// i18ncraft.config.js
module.exports = {
  scanDir: 'src',           // Directory to scan
  outDir: 'i18n_out',       // Output directory
  exts: ['.vue'],           // File extensions
  locale: {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome',
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel'
        }
      }
    },
    zh: {
      message: {
        hello: '你好世界',
        welcome: '欢迎',
        buttons: {
          submit: '提交',
          cancel: '取消'
        }
      }
    }
  }
}
```

### Command Line

```bash
# Basic transformation
npx i18ncraft

# Preview mode
npx i18ncraft --dry-run

# Verbose logging
npx i18ncraft --verbose
```

## ⚙️ Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `scanDir` | `string` | ✅ | - | Scan directory path |
| `outDir` | `string` | ✅ | - | Output directory path |
| `exts` | `string[]` | ✅ | `['.vue']` | File extensions |
| `locale` | `object` | ✅ | - | Locale configuration |

## 📋 TODO List

### ✅ Implemented Features

- [x] Vue SFC template transformation
- [x] Vue SFC script transformation
- [x] Batch file processing
- [x] Directory structure preservation
- [x] Basic error handling
- [x] TypeScript support
- [x] CLI tool
- [x] Configuration file support
- [x] Test coverage (45+ tests)
- [x] vue-i18n format support

### 🚧 In Development

- [ ] React JSX transformation
- [ ] Angular template transformation
- [ ] Svelte component transformation
- [ ] i18next format support
- [ ] react-i18next format support
- [ ] svelte-i18n format support
- [ ] Custom transformation plugins
- [ ] Webpack plugin
- [ ] Vite plugin
- [ ] Rollup plugin
- [ ] ESLint plugin
- [ ] VS Code extension
- [ ] Performance optimization for large projects
- [ ] Incremental transformation
- [ ] Git integration
- [ ] CI/CD integration

### 📋 Planned Features

- [ ] Support for other file types (.js, .ts, .jsx, .tsx)
- [ ] Support for other i18n libraries (react-intl, ngx-translate, etc.)
- [ ] Support for other frameworks (Next.js, Nuxt.js, etc.)
- [ ] Advanced key generation strategies
- [ ] Translation management integration
- [ ] Machine translation support
- [ ] Translation memory
- [ ] Pluralization support
- [ ] Date/number formatting
- [ ] RTL language support

## 🤝 Contributing

### Development Setup

```bash
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft
pnpm install
pnpm test
pnpm typecheck
```

### Code Standards

- TypeScript
- ESLint rules
- Test coverage
- Documentation updates

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- [GitHub Repository](https://github.com/exwer/i18ncraft)
- [NPM Package](https://www.npmjs.com/package/i18ncraft)
- [Issues](https://github.com/exwer/i18ncraft/issues)

---

**Made with ❤️ by [exwer](https://github.com/exwer)** 
