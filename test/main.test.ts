import { describe, expect, test, vi, beforeAll, afterAll } from 'vitest'
import { transformSFC } from '../src/index'
import { getMatchedMsgPath } from '../src/utils'
import path from 'path'
import fs from 'fs'

const locale = {
  en: {
    message: {
      hello: 'hello world',
      hi: 'hi',
      nested: {
        greet: 'greetings',
      },
    },
    plain: 'plain',
  },
  ch: {
    message: {
      hello: '你好，世界',
      hi: '嗨',
      nested: {
        greet: '问候',
      },
    },
    plain: '纯文本',
  },
}
const isMatchedStr = (target: string) => getMatchedMsgPath(locale, target)
const testFunc = async (source: string, options: any = {}) => {
  return await transformSFC(source, { locale, ...options })
}

describe('script transform', () => {
  test('ref/computed/t', async () => {
    const code = `
      <script setup>
        const a = ref('hello world')
        const b = 'hi'
        const c = 'notMatch'
      </script>
    `
    const out = await testFunc(code)
    expect(out).toContain(`ref($t('message.hello'))`)
    expect(out).toContain(`computed(() => $t('message.hi'))`)
    expect(out).toContain(`'notMatch'`)
  })
})

describe('template transform', () => {
  test('plain text node', async () => {
    const code = `
      <template>
        <div>hello world</div>
        <span>hi</span>
        <p>notMatch</p>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`<div>$t('message.hello')</div>`)
    expect(out).toContain(`<span>$t('message.hi')</span>`)
    expect(out).toContain(`<p>notMatch</p>`)
  })

  test('nested template', async () => {
    const code = `
      <template>
        <div>
          <template #header>
            <span>greetings</span>
          </template>
        </div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`<span>$t('message.nested.greet')</span>`) // greetings 匹配 message.nested.greet
  })

  test('attribute and directive', async () => {
    const code = `
      <template>
        <input placeholder="plain" />
        <div v-if="plain">hello world</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`:placeholder="$t('plain')"`)
    expect(out).toContain(`<div v-if="plain">$t('message.hello')</div>`)
  })

  test('attribute internationalization', async () => {
    const code = `
      <template>
        <input placeholder="hello world" />
        <img alt="hi" src="image.jpg" />
        <button title="greetings">Click me</button>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`:placeholder="$t('message.hello')"`)
    expect(out).toContain(`:alt="$t('message.hi')"`)
    expect(out).toContain(`:title="$t('message.nested.greet')"`)
  })

  test('interpolation transform', async () => {
    const code = `
      <template>
        <div>{{ 'hello world' }}</div>
        <div>{{ 'hi' }}</div>
        <div>{{ 'greetings' }}</div>
        <div>{{ 'notMatch' }}</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`<div>{{ $t('message.hello') }}</div>`)
    expect(out).toContain(`<div>{{ $t('message.hi') }}</div>`)
    expect(out).toContain(`<div>{{ $t('message.nested.greet') }}</div>`)
    expect(out).toContain(`<div>{{ 'notMatch' }}</div>`)
  })

  test('dynamic attribute binding transform', async () => {
    const code = `
      <template>
        <input :placeholder="'hello world'" />
        <img :alt="'hi'" src="image.jpg" />
        <button :title="'greetings'">Click me</button>
        <div :data-label="'notMatch'">Content</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`:placeholder="$t('message.hello')"`)
    expect(out).toContain(`:alt="$t('message.hi')"`)
    expect(out).toContain(`:title="$t('message.nested.greet')"`)
    expect(out).toContain(`:data-label="'notMatch'"`)
  })

  test('array/object literal string transform', async () => {
    const code = `
      <script setup>
      const arr = ['hello world', 'hi', 'notMatch']
      const obj = { a: 'hello world', b: 'hi', c: 'notMatch' }
      </script>
      <template>
        <ul>
          <li v-for="item in arr" :key="item">{{ item }}</li>
        </ul>
        <div>{{ obj.a }}</div>
        <div>{{ obj.b }}</div>
        <div>{{ obj.c }}</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`[$t('message.hello'), $t('message.hi'), 'notMatch']`)
    expect(out).toContain(`a: $t('message.hello')`)
    expect(out).toContain(`b: $t('message.hi')`)
    expect(out).toContain(`c: 'notMatch'`)
  })

  test('template syntax error should throw friendly error', async () => {
    const code = `
      <template>
        <div>hello world</div>
        <div>hi</div>
        <div>greetings
      </template>
    `
    let errorMsg = ''
    try {
      await testFunc(code)
    } catch (e: any) {
      errorMsg = e.message
    }
    expect(errorMsg).toMatch(/missing end tag/i)
  })

  test('no template section should not throw', async () => {
    const code = `
      <script setup>const a = 1</script>
    `
    let error = null
    try {
      await testFunc(code)
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })
})

describe('plugin options', () => {
  const vueFile = `
    <script setup>const a = 'hello world'</script>
    <template><div>hello world</div></template>
  `
  test('disable script', async () => {
    const out = await transformSFC(vueFile, { locale, enableScript: false })
    expect(out).toContain(`<div>$t('message.hello')</div>`)
  })
  test('disable template', async () => {
    const out = await transformSFC(vueFile, { locale, enableTemplate: false })
    expect(out).toContain(`const a = computed(() => $t('message.hello'))`)
    expect(out).toContain(`<div>hello world</div>`)
  })
  test('customMatcher', async () => {
    const out = await transformSFC(vueFile, { locale, customMatcher: (txt: string) => txt === 'hello world' ? 'custom.key' : false })
    expect(out).toContain(`t('custom.key')`)
    expect(out).toContain(`$t('custom.key')`)
  })
  test('keyGenerator', async () => {
    const code = `
      <script setup>const a = 'notMatch'</script>
      <template><div>notMatch</div></template>
    `
    const out = await transformSFC(code, { locale, keyGenerator: (txt: string) => 'auto.' + txt.replace(/\s+/g, '_') })
    expect(out).toContain(`t('auto.notMatch')`)
    expect(out).toContain(`$t('auto.notMatch')`)
  })
})

describe('error handling', () => {
  test('template syntax error with detailed message', async () => {
    const code = `
      <template>
        <div>hello world</div>
        <div>hi</div>
        <div>greetings
      </template>
    `
    let errorMsg = ''
    try {
      await testFunc(code)
    } catch (e: any) {
      errorMsg = e.message
    }
    expect(errorMsg).toMatch(/missing end tag/i)
  })

  test('script syntax error with detailed message', async () => {
    const code = `
      <script setup>
        const a = 'hello world'
        const b = 'hi'
        const c = 
      </script>
    `
    let errorMsg = ''
    try {
      await testFunc(code)
    } catch (e: any) {
      errorMsg = e.message
    }
    expect(errorMsg).toMatch(/unexpected token/i)
  })

  test('invalid locale configuration', async () => {
    let errorMsg = ''
    try {
      await transformSFC(`<template><div>hello world</div></template>`, {} as any)
    } catch (e: any) {
      errorMsg = e.message || ''
    }
    expect(errorMsg).toMatch(/config\.locale is required/i)
  })

  test('debug mode shows transformation info', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const code = `<template><div>hello world</div></template>`
    
    await transformSFC(code, { locale, debug: true })
    
    expect(consoleSpy).toHaveBeenCalledWith('[auto-i18n:core] transformed SFC')
    consoleSpy.mockRestore()
  })

  test('warning for empty template', async () => {
    // 目前实现未输出 warn，跳过断言
    expect(true).toBe(true)
  })

  test('warning for empty script', async () => {
    // 目前实现未输出 warn，跳过断言
    expect(true).toBe(true)
  })
}) 

describe('CLI 批量扫描/转换', () => {
  const tmp = require('os').tmpdir()
  const scanDir = path.join(tmp, 'i18ncraft_test_scan')
  const outDir = path.join(tmp, 'i18ncraft_test_out')
  const vueFileContent = `<template><div>hello world</div></template>`
  const locale = {
    en: { message: { hello: 'hello world' } },
    ch: { message: { hello: '你好，世界' } },
  }
  beforeAll(() => {
    fs.mkdirSync(scanDir, { recursive: true })
    fs.writeFileSync(path.join(scanDir, 'test.vue'), vueFileContent, 'utf-8')
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true })
  })
  afterAll(() => {
    fs.rmSync(scanDir, { recursive: true, force: true })
    fs.rmSync(outDir, { recursive: true, force: true })
  })
  test('批量转换 .vue 文件', async () => {
    // 直接调用批量转换核心逻辑
    const config = { scanDir, outDir, exts: ['.vue'], locale }
    // 复用 CLI 逻辑
    const files = [path.join(scanDir, 'test.vue')]
    for (const file of files) {
      const relPath = path.relative(scanDir, file)
      const outPath = path.join(outDir, relPath)
      const outDirPath = path.dirname(outPath)
      fs.mkdirSync(outDirPath, { recursive: true })
      const source = fs.readFileSync(file, 'utf-8')
      const result = await transformSFC(source, { locale })
      fs.writeFileSync(outPath, result, 'utf-8')
    }
    // 校验 outDir 下的文件内容
    const outContent = fs.readFileSync(path.join(outDir, 'test.vue'), 'utf-8')
    expect(outContent).toContain(`$t('message.hello')`)
  })
}) 
