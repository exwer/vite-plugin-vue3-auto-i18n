# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)

> 🚀 **i18ncraft** - 专业的国际化自动化工具，提供智能的批量文本转换和企业级错误处理。

<div align="center">
  <a href="README.md">📖 English Documentation</a>
</div>

## ⚠️ 开发状态

**该项目目前正在积极开发中，不建议用于生产环境。**

- 核心功能已实现并测试
- API 可能在未来的版本中发生变化
- 一些高级功能仍在开发中

## 📋 目录

- [快速开始](#快速开始)
- [核心特性](#核心特性)
- [安装](#安装)
- [使用](#使用)
- [配置](#配置)
- [TODO 列表](#todo-列表)
- [贡献指南](#贡献指南)

## 🚀 快速开始

### 1. 安装

```bash
npm install -D i18ncraft
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

### 3. 转换文件

```bash
npx i18ncraft
```

**转换前：**
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

**转换后：**
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

## ✨ 核心特性

- **Vue SFC 支持**：转换 `<template>` 和 `<script setup>` 部分
- **批量处理**：递归扫描目录，保持原有结构
- **智能匹配**：自动生成 i18n key，支持嵌套对象
- **类型安全**：完整的 TypeScript 支持
- **错误处理**：详细的错误信息和恢复建议
- **测试覆盖**：45+ 测试用例确保可靠性

## 📦 安装

### 环境要求

- Node.js >= 16.0.0
- TypeScript >= 4.5 (推荐)

### 安装

```bash
npm install -D i18ncraft
```

## 📖 使用

### 基础配置

```js
// i18ncraft.config.js
module.exports = {
  scanDir: 'src',           // 扫描目录
  outDir: 'i18n_out',       // 输出目录
  exts: ['.vue'],           // 文件扩展名
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

### 命令行

```bash
# 基础转换
npx i18ncraft

# 预览模式
npx i18ncraft --dry-run

# 详细日志
npx i18ncraft --verbose
```

## ⚙️ 配置

| 选项 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `scanDir` | `string` | ✅ | - | 扫描目录路径 |
| `outDir` | `string` | ✅ | - | 输出目录路径 |
| `exts` | `string[]` | ✅ | `['.vue']` | 文件扩展名 |
| `locale` | `object` | ✅ | - | 语言包配置 |

## 📋 TODO 列表

### ✅ 已实现功能

- [x] Vue SFC 模板转换
- [x] Vue SFC 脚本转换
- [x] 批量文件处理
- [x] 目录结构保持
- [x] 基础错误处理
- [x] TypeScript 支持
- [x] CLI 工具
- [x] 配置文件支持
- [x] 测试覆盖 (45+ 测试)
- [x] vue-i18n 格式支持

### 🚧 开发中

- [ ] React JSX 转换
- [ ] Angular 模板转换
- [ ] Svelte 组件转换
- [ ] i18next 格式支持
- [ ] react-i18next 格式支持
- [ ] svelte-i18n 格式支持
- [ ] 自定义转换插件
- [ ] Webpack 插件
- [ ] Vite 插件
- [ ] Rollup 插件
- [ ] ESLint 插件
- [ ] VS Code 扩展
- [ ] 大型项目性能优化
- [ ] 增量转换
- [ ] Git 集成
- [ ] CI/CD 集成

### 📋 计划功能

- [ ] 支持其他文件类型 (.js, .ts, .jsx, .tsx)
- [ ] 支持其他 i18n 库 (react-intl, ngx-translate 等)
- [ ] 支持其他框架 (Next.js, Nuxt.js 等)
- [ ] 高级 key 生成策略
- [ ] 翻译管理集成
- [ ] 机器翻译支持
- [ ] 翻译记忆
- [ ] 复数支持
- [ ] 日期/数字格式化
- [ ] RTL 语言支持

## 🤝 贡献指南

### 开发环境

```bash
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft
pnpm install
pnpm test
pnpm typecheck
```

### 代码规范

- TypeScript
- ESLint 规则
- 测试覆盖
- 文档更新

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [GitHub 仓库](https://github.com/exwer/i18ncraft)
- [NPM 包](https://www.npmjs.com/package/i18ncraft)
- [问题反馈](https://github.com/exwer/i18ncraft/issues)

---

**Made with ❤️ by [exwer](https://github.com/exwer)**
