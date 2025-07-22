# i18nCraft 🚀

> 🌍 专业的国际化自动化工具，提供智能的批量文本转换和企业级错误处理。

[![NPM version](https://img.shields.io/npm/v/i18ncraft.svg)](https://npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

<div align="center">
  <a href="README.md">📖 English Documentation</a>
</div>

## ✨ 特性

- 🎯 **智能文本识别** - 先进的模式匹配和智能文本提取
- 🔧 **多框架支持** - Vue.js、React 和原生 JavaScript 项目
- 🚀 **增强的 Vue 模板支持** - 全面的 Vue 语法兼容性，包括指令、动态属性和复杂表达式
- 🧩 **模块化架构** - 可扩展的转换器和提供者系统
- 📦 **多种集成选项** - CLI、编程式 API 和构建工具插件
- 🛡️ **企业级错误处理** - 全面的错误恢复和报告
- ⚡ **高性能** - 优化的字符串匹配和智能缓存
- 🎨 **灵活配置** - 可自定义的转换规则和输出格式

## 🚀 快速开始

### 安装

```bash
npm install i18ncraft
# 或
pnpm add i18ncraft
# 或
yarn add i18ncraft
```

### 基本用法

#### Vue.js 项目

**转换前：**
```vue
<template>
  <div class="app">
    <h1>你好世界</h1>
    <p>欢迎使用我们的应用</p>
    <input placeholder="请输入您的姓名" />
    <button :title="'点击提交'">提交</button>
    <div v-text="'加载中...'"></div>
    <my-component :config="{ text: '保存', label: '取消' }" />
  </div>
</template>

<script setup>
const message = '你好世界'
const buttonText = '点击我'
</script>
```

**转换后：**
```vue
<template>
  <div class="app">
    <h1>{{ $t('message.hello') }}</h1>
    <p>{{ $t('message.welcome') }}</p>
    <input :placeholder="$t('message.placeholder')" />
    <button :title="$t('message.submit')">{{ $t('message.submit') }}</button>
    <div v-text="$t('message.loading')"></div>
    <my-component :config="{ text: $t('message.save'), label: $t('message.cancel') }" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ✅ 优化：只有顶层变量用 computed() 包装
// 内部字符串使用简单的 t() 调用以获得更好的性能
const message = computed(() => t('message.hello'))
const buttonText = computed(() => t('message.clickMe'))
</script>
```

**编程式用法：**
```typescript
import { VueTransformer } from 'i18ncraft'

const transformer = new VueTransformer(sourceCode, {
  locale: {
    en: {
      message: {
        hello: '你好世界',
        welcome: '欢迎使用我们的应用',
        placeholder: '请输入您的姓名',
        submit: '点击提交',
        loading: '加载中...',
        save: '保存',
        cancel: '取消',
        clickMe: '点击我'
      }
    }
  }
})

const result = await transformer.transform()
console.log(result.code) // 转换后的代码
console.log(result.matches) // 找到的翻译
```

#### React 项目

**转换前：**
```jsx
import React from 'react'

function App() {
  const [title] = useState('你好世界')
  
  return (
    <div className="app">
      <h1>{title}</h1>
      <p>欢迎使用我们的应用</p>
      <input placeholder="请输入您的姓名" />
      <button>提交</button>
      <div>加载中...</div>
    </div>
  )
}
```

**转换后：**
```jsx
import React from 'react'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()
  const [title] = useState(t('message.hello'))
  
  return (
    <div className="app">
      <h1>{title}</h1>
      <p>{t('message.welcome')}</p>
      <input placeholder={t('message.placeholder')} />
      <button>{t('message.submit')}</button>
      <div>{t('message.loading')}</div>
    </div>
  )
}
```

**编程式用法：**
```typescript
import { ReactTransformer } from 'i18ncraft'

const transformer = new ReactTransformer(sourceCode, {
  locale: {
    en: {
      message: {
        hello: '你好世界',
        welcome: '欢迎使用我们的应用',
        placeholder: '请输入您的姓名',
        submit: '提交',
        loading: '加载中...'
      }
    }
  }
})

const result = await transformer.transform()
```

#### 原生 JavaScript

**转换前：**
```javascript
const messages = {
  greeting: '你好世界',
  farewell: '再见'
}

function showMessage() {
  alert('欢迎使用我们的应用')
  console.log('调试：用户已登录')
}
```

**转换后：**
```javascript
const messages = {
  greeting: translate('message.hello'),
  farewell: translate('message.goodbye')
}

function showMessage() {
  alert(translate('message.welcome'))
  console.log('调试：用户已登录')
}
```

**编程式用法：**
```typescript
import { JavaScriptTransformer } from 'i18ncraft'

const transformer = new JavaScriptTransformer(sourceCode, {
  locale: {
    en: {
      message: {
        hello: '你好世界',
        goodbye: '再见',
        welcome: '欢迎使用我们的应用'
      }
    }
  }
})

const result = await transformer.transform()
```

### CLI 用法

```bash
# 转换 Vue 文件
i18ncraft transform --input src --output dist --locale ./locales/zh.json

# 使用自定义配置进行批量处理
i18ncraft transform --config ./i18n.config.js
```

**示例输出：**
```bash
$ i18ncraft transform --input src --output dist

✨ i18nCraft - 正在转换您的项目...

📁 处理 src/
  ✅ components/Header.vue (找到 3 个匹配项)
  ✅ components/Button.vue (找到 2 个匹配项) 
  ✅ pages/Home.vue (找到 8 个匹配项)
  ✅ utils/messages.js (找到 5 个匹配项)

🎉 转换完成！
  📊 已处理文件：4
  🔍 总匹配数：18 个翻译
  ⚡ 耗时：1.2秒
  📂 输出：dist/
```

## 🎯 Vue 模板支持

i18nCraft 提供全面的 Vue 模板转换支持：

### ✅ 完全支持的语法

**输入：**
```vue
<template>
  <!-- 基本文本插值 -->
  <h1>你好世界</h1>
  
  <!-- 静态属性 -->
  <input placeholder="请输入您的姓名" />
  
  <!-- 动态属性 -->
  <input :placeholder="'请输入您的邮箱'" />
  <button :[dynamicAttr]="'提交'">点击</button>
  
  <!-- Vue 指令 -->
  <p v-text="'你好世界'"></p>
  <div v-html="'<strong>欢迎</strong>'"></div>
  
  <!-- 组件 props 中的复杂表达式 -->
  <my-component 
    :config="{ text: '你好', label: '提交' }"
    :items="['加载中...', '成功！']"
  />
  
  <!-- 条件渲染 -->
  <p v-if="show">欢迎消息</p>
  
  <!-- 列表渲染 -->
  <li v-for="item in items">项目文本</li>
  
  <!-- 插槽 -->
  <template #header>
    <h2>页面标题</h2>
  </template>
</template>
```

**输出：**
```vue
<template>
  <!-- 基本文本插值 -->
  <h1>{{ $t('message.hello') }}</h1>
  
  <!-- 静态属性 -->
  <input :placeholder="$t('message.placeholder')" />
  
  <!-- 动态属性 -->
  <input :placeholder="$t('message.email')" />
  <button :[dynamicAttr]="$t('message.submit')">点击</button>
  
  <!-- Vue 指令 -->
  <p v-text="$t('message.hello')"></p>
  <div v-html="$t('message.welcome')"></div>
  
  <!-- 组件 props 中的复杂表达式 -->
  <my-component 
    :config="{ text: $t('message.hello'), label: $t('message.submit') }"
    :items="[$t('message.loading'), $t('message.success')]"
  />
  
  <!-- 条件渲染 -->
  <p v-if="show">{{ $t('message.welcome') }}</p>
  
  <!-- 列表渲染 -->
  <li v-for="item in items">{{ $t('message.item') }}</li>
  
  <!-- 插槽 -->
  <template #header>
    <h2>{{ $t('message.title') }}</h2>
  </template>
</template>
```

### 🛡️ 智能跳过

```vue
<template>
  <div>
    <!-- JavaScript 表达式（正确保留） -->
    <p>{{ user.name || '访客' }}</p>
    <button @click="alert('调试信息')">调试</button>
    
    <!-- 现有的 i18n 调用（保留） -->
    <p>{{ $t('existing.key') }}</p>
    <span>{{ $tc('message.item', count) }}</span>
  </div>
</template>
```

## 🏗️ 架构

i18nCraft 遵循模块化架构，具有清晰的关注点分离：

```
src/
├── core/
│   ├── transformer/        # 基础转换器类
│   │   ├── base.ts         # 抽象基础转换器
│   │   ├── vue.ts          # Vue 专用转换器
│   │   ├── react.ts        # React 专用转换器
│   │   └── javascript.ts   # 原生 JS 转换器
│   ├── providers/          # i18n 库适配器
│   │   ├── vue-i18n.ts     # Vue I18n 提供者
│   │   ├── react-i18next.ts # React i18next 提供者
│   │   └── vanilla-js.ts   # 原生 JS 提供者
│   ├── parsers/            # AST 解析工具
│   │   └── recast-parser.ts # JavaScript AST 解析器
│   ├── middleware/         # 处理中间件
│   └── matcher.ts          # 文本匹配引擎
├── plugins/                # 构建工具集成
├── cli/                    # 命令行界面
└── types/                  # TypeScript 定义
```

## 🔧 配置

### 转换选项

```typescript
interface TransformOptions {
  locale: LocaleConfig        // 语言配置
  provider?: I18nProvider     // 可选的自定义提供者
}
```

### CLI 配置

```javascript
// i18n.config.js
export default {
  scanDir: './src',
  outDir: './dist',
  exts: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
  locale: {
    zh: {
      // 您的语言消息
    }
  }
}
```

## 🧩 自定义提供者

为不同的库创建自定义 i18n 提供者：

```typescript
import { I18nProvider } from 'i18ncraft'

const customProvider: I18nProvider = {
  createTranslationAst: (key: string) => {
    // 为您的 i18n 库返回 AST 节点
    return t.callExpression(
      t.identifier('translate'),
      [t.stringLiteral(key)]
    )
  }
}
```

## 📊 性能

- **智能缓存**：智能缓存匹配的字符串和转换结果
- **单次遍历**：每种转换类型只处理内容一次
- **优化的正则表达式**：精心制作的正则表达式以获得最大效率
- **内存高效**：流式处理的最小内存占用

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 📄 许可证

MIT © [exwer](https://github.com/exwer)

## 🙏 致谢

- Vue.js 团队提供的优秀编译器工具
- React 团队提供的转换灵感
- i18n 社区提供的宝贵反馈和贡献

---

<div align="center">
  <sub>用 ❤️ 构建，作者：<a href="https://github.com/exwer">exwer</a></sub>
</div>
