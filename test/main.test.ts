import { describe, expect, test } from 'vitest'
import { start } from '../src/index'
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
const testFunc = (source: string) => start(source, isMatchedStr)

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
}) 
