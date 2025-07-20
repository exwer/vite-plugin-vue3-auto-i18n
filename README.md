# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.0+-green.svg)](https://vuejs.org/)

> 🚀 **i18ncraft** - 专业的 Vue 3 项目国际化自动化工具，提供智能的批量文本转换、多格式支持和企业级错误处理。

## 📋 目录

- [快速开始](#快速开始)
- [核心特性](#核心特性)
- [安装配置](#安装配置)
- [使用指南](#使用指南)
- [配置参考](#配置参考)
- [API 文档](#api-文档)
- [高级用法](#高级用法)
- [故障排除](#故障排除)
- [贡献指南](#贡献指南)

## 🚀 快速开始

### 1. 安装

```bash
npm install -D i18ncraft
# 或
pnpm add -D i18ncraft
```

### 2. 创建配置

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

### 3. 执行转换

```bash
npx i18ncraft
```

**转换前：**
```vue
<template>
  <div>hello world</div>
  <button>{{ 'hi' }}</button>
</template>
```

**转换后：**
```vue
<template>
  <div>{{ $t('message.hello') }}</div>
  <button>{{ $t('message.hi') }}</button>
</template>
```

## ✨ 核心特性

### 🎯 **智能转换**
- **Vue 3 SFC 支持**：完整的 `<template>` 和 `<script setup>` 转换
- **多格式适配**：支持 vue-i18n、i18next、react-i18next 等主流框架
- **批量处理**：递归扫描目录，保持原有文件结构
- **智能匹配**：自动生成 i18n key，支持嵌套对象

### 🛡️ **企业级质量**
- **类型安全**：完整的 TypeScript 支持
- **错误处理**：详细的错误信息和恢复建议
- **测试覆盖**：45+ 测试用例，确保转换可靠性
- **性能优化**：大文件处理优化，内存使用控制

### 🔧 **开发体验**
- **配置驱动**：灵活的配置文件支持
- **CLI 工具**：命令行界面，支持批量操作
- **实时反馈**：详细的转换进度和结果报告
- **调试友好**：丰富的日志和错误追踪

## 📦 安装配置

### 环境要求

- Node.js >= 16.0.0
- Vue 3.x
- TypeScript >= 4.5 (推荐)

### 安装方式

#### 本地安装（推荐）
```bash
npm install -D i18ncraft
```

#### 全局安装
```bash
npm install -g i18ncraft
```

### 项目集成

#### Vite 项目
```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import i18ncraft from 'i18ncraft'

export default defineConfig({
  plugins: [
    vue(),
    i18ncraft({
      // 配置选项
    })
  ]
})
```

#### Webpack 项目
```js
// webpack.config.js
const i18ncraft = require('i18ncraft')

module.exports = {
  plugins: [
    new i18ncraft({
      // 配置选项
    })
  ]
}
```

## 📖 使用指南

### 基础用法

#### 1. 配置文件结构

```js
// i18ncraft.config.js
module.exports = {
  // 扫描目录
  scanDir: 'src',
  
  // 输出目录
  outDir: 'i18n_out',
  
  // 文件扩展名
  exts: ['.vue'],
  
  // 语言包配置
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
  
  // 转换格式配置
  transformFormat: {
    template: (key) => `$t('${key}')`,
    script: (key) => `computed(() => $t('${key}'))`,
    interpolation: (key) => `$t('${key}')`
  }
}
```

#### 2. 命令行使用

```bash
# 基础转换
npx i18ncraft

# 指定配置文件
npx i18ncraft --config ./custom.config.js

# 预览模式（不实际转换文件）
npx i18ncraft --dry-run

# 详细日志
npx i18ncraft --verbose
```

#### 3. 转换示例

**输入文件：**
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

**输出文件：**
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

## ⚙️ 配置参考

### 配置选项

| 选项 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `scanDir` | `string` | ✅ | - | 扫描目录路径 |
| `outDir` | `string` | ✅ | - | 输出目录路径 |
| `exts` | `string[]` | ✅ | `['.vue']` | 文件扩展名 |
| `locale` | `object` | ✅ | - | 语言包配置 |
| `transformFormat` | `object` | ❌ | 默认格式 | 转换格式配置 |
| `ignore` | `string[]` | ❌ | `[]` | 忽略的文件/目录 |
| `dryRun` | `boolean` | ❌ | `false` | 预览模式 |

### 语言包配置

```js
locale: {
  // 英文
  en: {
    message: {
      // 基础键值
      hello: 'Hello World',
      welcome: 'Welcome',
      
      // 嵌套对象
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save'
      },
      
      // 数组形式
      errors: [
        'Invalid input',
        'Network error',
        'Server error'
      ]
    },
    
    // 多个命名空间
    common: {
      loading: 'Loading...',
      success: 'Success',
      error: 'Error'
    }
  },
  
  // 中文
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

### 转换格式配置

#### 默认格式（Vue + vue-i18n）
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

#### 自定义格式
```js
transformFormat: {
  template: (key) => `i18n.get('${key}')`,
  script: (key) => `reactive(() => i18n.get('${key}'))`,
  interpolation: (key) => `i18n.get('${key}')`
}
```

## 📚 API 文档

### 核心 API

#### `transformSFC(source: string, options: TransformOptions): TransformResult`

转换单个 Vue SFC 文件。

```ts
import { transformSFC } from 'i18ncraft'

const result = transformSFC(sourceCode, {
  locale: { /* 语言包 */ },
  transformFormat: { /* 转换格式 */ }
})

console.log(result.code) // 转换后的代码
console.log(result.matches) // 匹配的文本
```

#### `processDirectory(options: ProcessOptions): ProcessResult`

批量处理目录。

```ts
import { processDirectory } from 'i18ncraft'

const result = await processDirectory({
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* 语言包 */ }
})

console.log(result.processedFiles) // 处理的文件数
console.log(result.errors) // 错误信息
```

### 类型定义

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

## 🔧 高级用法

### 自定义转换逻辑

```js
// 自定义转换格式
const customFormat = {
  template: (key) => `$i18n.t('${key}')`,
  script: (key) => `useI18nText('${key}')`,
  interpolation: (key) => `$i18n.t('${key}')`
}

// 使用自定义格式
module.exports = {
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* ... */ },
  transformFormat: customFormat
}
```

### 条件转换

```js
// 根据文件路径条件转换
module.exports = {
  scanDir: 'src',
  outDir: 'i18n_out',
  locale: { /* ... */ },
  
  // 自定义转换条件
  shouldTransform: (filePath) => {
    // 只转换特定目录下的文件
    return filePath.includes('/components/')
  }
}
```

### 批量处理脚本

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
    
    console.log(`处理完成：${result.processedFiles} 个文件`)
    console.log(`总匹配数：${result.totalMatches}`)
    
    if (result.errors.length > 0) {
      console.error('错误：', result.errors)
    }
  } catch (error) {
    console.error('处理失败：', error)
  }
}

batchTransform()
```

## 🐛 故障排除

### 常见问题

#### 1. 转换失败
**问题：** 文件转换失败，提示语法错误
**解决：** 检查 Vue 文件语法是否正确，确保使用 Vue 3 语法

#### 2. 语言包不匹配
**问题：** 某些文本没有被转换
**解决：** 检查语言包配置，确保文本在语言包中存在

#### 3. 输出目录不存在
**问题：** 输出目录创建失败
**解决：** 确保有足够的权限，或手动创建输出目录

#### 4. 性能问题
**问题：** 大文件处理缓慢
**解决：** 使用 `--verbose` 查看详细日志，考虑分批处理

### 错误代码

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| `E001` | 配置文件不存在 | 检查配置文件路径 |
| `E002` | 扫描目录不存在 | 检查扫描目录路径 |
| `E003` | 语法错误 | 检查 Vue 文件语法 |
| `E004` | 权限错误 | 检查文件权限 |
| `E005` | 内存不足 | 分批处理或增加内存 |

### 调试技巧

```bash
# 启用详细日志
npx i18ncraft --verbose

# 预览模式
npx i18ncraft --dry-run

# 指定配置文件
npx i18ncraft --config ./debug.config.js
```

## 🤝 贡献指南

### 开发环境

```bash
# 克隆项目
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 构建项目
npx unbuild
```

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写测试用例
- 更新文档

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建工具
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [GitHub 仓库](https://github.com/exwer/i18ncraft)
- [NPM 包](https://www.npmjs.com/package/i18ncraft)
- [问题反馈](https://github.com/exwer/i18ncraft/issues)
- [更新日志](https://github.com/exwer/i18ncraft/releases)

---

**Made with ❤️ by [exwer](https://github.com/exwer)**
