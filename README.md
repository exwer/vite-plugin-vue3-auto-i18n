# i18ncraft

[![NPM version](https://img.shields.io/npm/v/i18ncraft?color=a1b858&label=)](https://www.npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft)](https://github.com/exwer/i18ncraft/blob/main/LICENSE)

> 🚀 **i18ncraft** 是一个面向 Vue 3 项目的自动国际化批量转换 CLI 工具，支持高效扫描、转换 .vue 文件中的文本和属性，极大提升多语言开发效率。

---

## ✨ 功能特性

- ⚡ **批量扫描/转换**：递归扫描指定目录下所有 .vue 文件，自动替换文本为 $t('key') 调用
- 🧩 **配置驱动**：通过配置文件灵活指定扫描目录、输出目录、语言包等
- 📝 **支持 script/template**：同时转换 <template> 和 <script setup> 区域的字符串
- 🛡️ **健壮错误处理**：详细的语法错误、配置错误提示，便于定位问题
- 🧪 **完善测试**：内置 Vitest 测试，确保转换逻辑可靠
- 🐾 **保持目录结构**：输出目录结构与源目录一致，便于集成

---

## 📦 安装

```bash
npm install -D i18ncraft
# 或
pnpm add -D i18ncraft
```

---

## 🚀 快速上手

### 1. 创建配置文件

在项目根目录新建 `i18ncraft.config.js`：

```js
module.exports = {
  scanDir: 'src',           // 需要扫描的目录（必填）
  outDir: 'i18n_out',       // 输出目录（必填）
  exts: ['.vue'],           // 仅支持 .vue 文件
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

### 2. 执行批量转换

```bash
npx i18ncraft
```

- 工具会自动读取配置文件，递归扫描 `scanDir` 下所有 .vue 文件，转换后输出到 `outDir`，保持原有目录结构。

---

## ⚙️ 配置说明

| 字段      | 类型      | 说明                       | 必填 |
|-----------|-----------|----------------------------|------|
| scanDir   | string    | 需要扫描的目录             | 是   |
| outDir    | string    | 输出目录                   | 是   |
| exts      | string[]  | 文件扩展名，仅支持['.vue'] | 是   |
| locale    | object    | 语言包对象                 | 是   |

---

## 📝 示例

### 源文件 src/Hello.vue
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

### 转换后 i18n_out/Hello.vue
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

## 🛡️ 错误处理

- **模板语法错误**：详细报错并指明缺失标签等问题
- **脚本语法错误**：定位到具体 token 错误
- **配置错误**：缺少 scanDir、outDir、exts、locale 等会直接报错

---

## 🧪 测试

本项目内置 Vitest 测试，覆盖所有转换逻辑和异常场景，确保每次发布都稳定可靠。

```bash
pnpm exec vitest run
```

---

## 📄 License

[MIT](./LICENSE)

---

## 🙋 常见问题

- **Q: 支持哪些文件类型？**
  目前仅支持 .vue 文件，后续可扩展。
- **Q: 输出目录会覆盖原文件吗？**
  不会，所有转换结果输出到 outDir，源文件不变。
- **Q: 支持自定义 key 生成或匹配吗？**
  支持，可在 locale 配置和后续扩展中自定义。

---

如有更多问题或建议，欢迎在 [GitHub Issues](https://github.com/exwer/i18ncraft/issues) 反馈！
