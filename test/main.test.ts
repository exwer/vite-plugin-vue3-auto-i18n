import { describe, expect, test } from 'vitest'
import Vue3I18n, { AutoI18nOptions } from '../src/index'
import { getMatchedMsgPath } from '../src/utils'

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
const testFunc = async (source: string) => {
  const out = await Vue3I18n(locale, {}).transform(source, 'test.vue')
  return out?.code ?? ''
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
    expect(out).toContain(`ref(t('message.hello'))`)
    expect(out).toContain(`computed(() => t('message.hi'))`)
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
    expect(out).toContain(`[t('message.hello'), t('message.hi'), 'notMatch']`)
    expect(out).toContain(`a: t('message.hello')`)
    expect(out).toContain(`b: t('message.hi')`)
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
    expect(errorMsg).toMatch(/template parse error/i)
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
  const baseLocale = locale
  const vueFile = `
    <script setup>const a = 'hello world'</script>
    <template><div>hello world</div></template>
  `
  function runWithOptions(options: Partial<AutoI18nOptions>) {
    const plugin = Vue3I18n(baseLocale, options)
    // @ts-ignore
    return plugin.transform(vueFile, 'test.vue')
  }
  test('disable script', async () => {
    const out = await runWithOptions({ enableScript: false })
    if (!out) throw new Error('transform result is undefined')
    expect(out.code).toContain(`<div>$t('message.hello')</div>`)
  })
  test('disable template', async () => {
    const out = await runWithOptions({ enableTemplate: false })
    if (!out) throw new Error('transform result is undefined')
    expect(out.code).toContain(`const a = computed(() => t('message.hello'))`)
    expect(out.code).toContain(`<div>hello world</div>`)
  })
  test('exclude by string', async () => {
    const plugin = Vue3I18n(baseLocale, { exclude: ['test.vue'] })
    // @ts-ignore
    const out = await plugin.transform(vueFile, 'test.vue')
    expect(out).toBeUndefined()
  })
  test('exclude by regexp', async () => {
    const plugin = Vue3I18n(baseLocale, { exclude: [/test\.vue$/] })
    // @ts-ignore
    const out = await plugin.transform(vueFile, 'test.vue')
    expect(out).toBeUndefined()
  })
  test('customMatcher', async () => {
    const out = await runWithOptions({ customMatcher: (txt) => txt === 'hello world' ? 'custom.key' : false })
    if (!out) throw new Error('transform result is undefined')
    expect(out.code).toContain(`t('custom.key')`)
    expect(out.code).toContain(`$t('custom.key')`)
  })
}) 
