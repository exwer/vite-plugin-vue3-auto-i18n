# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.0+-green.svg)](https://vuejs.org/)

> 🚀 **i18ncraft** - Professional Vue 3 internationalization automation tool with intelligent batch text transformation, multi-format support, and enterprise-grade error handling.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Core Features](#core-features)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Configuration Reference](#configuration-reference)
- [API Documentation](#api-documentation)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🚀 Quick Start

### 1. Installation

```bash
npm install -D i18ncraft
# or
pnpm add -D i18ncraft
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
        hi: 'Hi',
        welcome: 'Welcome'
      }
    },
    zh: {
      message: { 
        hello: '你好世界', 
        hi: '嗨',
        welcome: '欢迎'
      }
    }
  }
}
```

### 3. Execute Transformation

```bash
npx i18ncraft
```

**Before transformation:**
```vue
<template>
  <div>hello world</div>
  <button>{{ 'hi' }}</button>
</template>
```

**After transformation:**
```vue
<template>
  <div>{{ $t('message.hello') }}</div>
  <button>{{ $t('message.hi') }}</button>
</template>
```

## ✨ Core Features

### 🎯 **Intelligent Transformation**
- **Vue 3 SFC Support**: Complete `<template>` and `<script setup>` transformation
- **Multi-format Adaptation**: Support for vue-i18n, i18next, react-i18next, and other mainstream frameworks
- **Batch Processing**: Recursive directory scanning with preserved file structure
- **Smart Matching**: Automatic i18n key generation with nested object support

### 🛡️ **Enterprise-grade Quality**
- **Type Safety**: Complete TypeScript support
- **Error Handling**: Detailed error messages and recovery suggestions
- **Test Coverage**: 45+ test cases ensuring transformation reliability
- **Performance Optimization**: Large file processing optimization with memory usage control

### 🔧 **Developer Experience**
- **Configuration-driven**: Flexible configuration file support
- **CLI Tool**: Command-line interface with batch operation support
- **Real-time Feedback**: Detailed transformation progress and result reporting
- **Debug-friendly**: Rich logging and error tracking

## 📦 Installation & Setup

### Requirements

- Node.js >= 16.0.0
- Vue 3.x
- TypeScript >= 4.5 (recommended)

### Installation Methods

#### Local Installation (Recommended)
```bash
npm install -D i18ncraft
```

#### Global Installation
```bash
npm install -g i18ncraft
```

### Project Integration

#### Vite Project
```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import i18ncraft from 'i18ncraft'

export default defineConfig({
  plugins: [
    vue(),
    i18ncraft({
      // configuration options
    })
  ]
})
```

#### Webpack Project
```js
// webpack.config.js
const i18ncraft = require('i18ncraft')

module.exports = {
  plugins: [
    new i18ncraft({
      // configuration options
    })
  ]
}
```

## 📖 Usage Guide

### Basic Usage

#### 1. Configuration File Structure

```js
// i18ncraft.config.js
module.exports = {
  // Scan directory
  scanDir: 'src',
  
  // Output directory
  outDir: 'i18n_out',
  
  // File extensions
  exts: ['.vue'],
  
  // Locale configuration
  locale: {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome to our app',
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel'
        }
      }
    },
    zh: {
      message: {
        hello: '你好世界',
        welcome: '欢迎使用我们的应用',
        buttons: {
          submit: '提交',
          cancel: '取消'
        }
      }
    }
  },
  
  // Transformation format configuration
  transformFormat: {
    template: (key) => `$t('${key}')`,
    script: (key) => `computed(() => $t('${key}'))`,
    interpolation: (key) => `$t('${key}')`
  }
}
```

#### 2. Command Line Usage

```bash
# Basic transformation
npx i18ncraft

# Specify configuration file
npx i18ncraft --config ./custom.config.js

# Preview mode (no actual file transformation)
npx i18ncraft --dry-run

# Verbose logging
npx i18ncraft --verbose
```

#### 3. Transformation Example

**Input file:**
```vue
<script setup>
const title = 'hello world'
const messages = ['hi', 'welcome']
const buttonText = 'submit'
</script>

<template>
  <div class="app">
    <h1>{{ title }}</h1>
    <p>{{ messages[0] }}</p>
    <button>{{ buttonText }}</button>
  </div>
</template>
```

**Output file:**
```vue
<script setup>
import { computed } from 'vue'

const title = computed(() => $t('message.hello'))
const messages = [computed(() => $t('message.hi')), computed(() => $t('message.welcome'))]
const buttonText = computed(() => $t('message.buttons.submit'))
</script>

<template>
  <div class="app">
    <h1>{{ title }}</h1>
    <p>{{ messages[0] }}</p>
    <button>{{ buttonText }}</button>
  </div>
</template>
```

## ⚙️ Configuration Reference

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `scanDir` | `string` | ✅ | - | Scan directory path |
| `outDir` | `string` | ✅ | - | Output directory path |
| `exts` | `string[]` | ✅ | `['.vue']` | File extensions |
| `locale` | `object` | ✅ | - | Locale configuration |
| `transformFormat` | `object` | ❌ | Default format | Transformation format configuration |
| `ignore` | `string[]` | ❌ | `[]` | Files/directories to ignore |
| `dryRun` | `boolean` | ❌ | `false` | Preview mode |

### Locale Configuration

```js
locale: {
  // English
  en: {
    message: {
      // Basic key-value pairs
      hello: 'Hello World',
      welcome: 'Welcome',
      
      // Nested objects
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save'
      },
      
      // Array format
      errors: [
        'Invalid input',
        'Network error',
        'Server error'
      ]
    },
    
    // Multiple namespaces
    common: {
      loading: 'Loading...',
      success: 'Success',
      error: 'Error'
    }
  },
  
  // Chinese
  zh: {
    message: {
      hello: '你好世界',
      welcome: '欢迎',
      buttons: {
        submit: '提交',
        cancel: '取消',
        save: '保存'
      },
      errors: [
        '输入无效',
        '网络错误',
        '服务器错误'
      ]
    },
    common: {
      loading: '加载中...',
      success: '成功',
      error: '错误'
    }
  }
}
```

### Transformation Format Configuration

#### Default Format (Vue + vue-i18n)
```js
transformFormat: {
  template: (key) => `$t('${key}')`,
  script: (key) => `computed(() => $t('${key}'))`,
  interpolation: (key) => `$t('${key}')`
}
```

#### React + react-i18next
```js
transformFormat: {
  template: (key) => `{t('${key}')}`,
  script: (key) => `useMemo(() => t('${key}'), [t])`,
  interpolation: (key) => `t('${key}')`
}
```

#### Custom Format
```js
transformFormat: {
  template: (key) => `i18n.get('${key}')`,
  script: (key) => `reactive(() => i18n.get('${key}'))`,
  interpolation: (key) => `i18n.get('${key}')`
}
```

## 📚 API Documentation

### Core APIs

#### `transformSFC(source: string, options: TransformOptions): TransformResult`

Transform a single Vue SFC file.

```ts
import { transformSFC } from 'i18ncraft'

const result = transformSFC(sourceCode, {
  locale: { /* locale config */ },
  transformFormat: { /* transformation format */ }
})

console.log(result.code) // Transformed code
console.log(result.matches) // Matched texts
```

#### `processDirectory(options: ProcessOptions): ProcessResult`

Batch process directories.

```ts
import { processDirectory } from 'i18ncraft'

const result = await processDirectory({
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* locale config */ }
})

console.log(result.processedFiles) // Number of processed files
console.log(result.errors) // Error messages
```

### Type Definitions

```ts
interface TransformOptions {
  locale: LocaleConfig
  transformFormat?: TransformFormat
  ignore?: string[]
}

interface TransformResult {
  code: string
  matches: TextMatch[]
  errors: Error[]
}

interface ProcessOptions {
  scanDir: string
  outDir: string
  exts: string[]
  locale: LocaleConfig
  transformFormat?: TransformFormat
  ignore?: string[]
  dryRun?: boolean
}

interface ProcessResult {
  processedFiles: number
  totalMatches: number
  errors: Error[]
  warnings: Warning[]
}
```

## 🔧 Advanced Usage

### Custom Transformation Logic

```js
// Custom transformation format
const customFormat = {
  template: (key) => `$i18n.t('${key}')`,
  script: (key) => `useI18nText('${key}')`,
  interpolation: (key) => `$i18n.t('${key}')`
}

// Use custom format
module.exports = {
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* ... */ },
  transformFormat: customFormat
}
```

### Conditional Transformation

```js
// Transform based on file path conditions
module.exports = {
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* ... */ },
  
  // Custom transformation conditions
  shouldTransform: (filePath) => {
    // Only transform files in specific directories
    return filePath.includes('/components/')
  }
}
```

### Batch Processing Script

```js
// batch-transform.js
const { processDirectory } = require('i18ncraft')

async function batchTransform() {
  try {
    const result = await processDirectory({
      scanDir: 'src',
      outDir: 'i18n_out',
      exts: ['.vue'],
      locale: require('./i18ncraft.config.js').locale
    })
    
    console.log(`Processing completed: ${result.processedFiles} files`)
    console.log(`Total matches: ${result.totalMatches}`)
    
    if (result.errors.length > 0) {
      console.error('Errors:', result.errors)
    }
  } catch (error) {
    console.error('Processing failed:', error)
  }
}

batchTransform()
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Transformation Failure
**Problem:** File transformation fails with syntax error
**Solution:** Check Vue file syntax, ensure Vue 3 syntax is used

#### 2. Locale Mismatch
**Problem:** Some texts are not transformed
**Solution:** Check locale configuration, ensure texts exist in locale

#### 3. Output Directory Issues
**Problem:** Output directory creation fails
**Solution:** Ensure sufficient permissions or manually create output directory

#### 4. Performance Issues
**Problem:** Slow processing of large files
**Solution:** Use `--verbose` for detailed logs, consider batch processing

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `E001` | Configuration file not found | Check configuration file path |
| `E002` | Scan directory not found | Check scan directory path |
| `E003` | Syntax error | Check Vue file syntax |
| `E004` | Permission error | Check file permissions |
| `E005` | Insufficient memory | Batch process or increase memory |

### Debugging Tips

```bash
# Enable verbose logging
npx i18ncraft --verbose

# Preview mode
npx i18ncraft --dry-run

# Specify configuration file
npx i18ncraft --config ./debug.config.js
```

## 🤝 Contributing

### Development Environment

```bash
# Clone repository
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft

# Install dependencies
pnpm install

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Build project
npx unbuild
```

### Code Standards

- Use TypeScript
- Follow ESLint rules
- Write test cases
- Update documentation

### Commit Standards

```
feat: new feature
fix: bug fix
docs: documentation update
style: code formatting
refactor: refactoring
test: test related
chore: build tools
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Related Links

- [GitHub Repository](https://github.com/exwer/i18ncraft)
- [NPM Package](https://www.npmjs.com/package/i18ncraft)
- [Issue Tracker](https://github.com/exwer/i18ncraft/issues)
- [Release Notes](https://github.com/exwer/i18ncraft/releases)

---

**Made with ❤️ by [exwer](https://github.com/exwer)** 
