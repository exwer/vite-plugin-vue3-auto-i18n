import { describe, it, expect, beforeEach } from 'vitest'
import { VueTransformer } from '../src/core/transformer/vue'
import type { TransformOptions } from '../src/types'

describe('Optimized Computed Transformation', () => {
  let options: TransformOptions

  beforeEach(() => {
    options = {
      locale: {
        en: {
          message: {
            hello: 'Hello World',
            welcome: 'Welcome',
            submit: 'Submit',
            cancel: 'Cancel'
          }
        }
      }
    }
  })

  it('should wrap only top-level variables with computed, not individual strings', async () => {
    const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
const config = {
  title: 'Hello World',
  actions: {
    primary: 'Submit',
    secondary: 'Cancel'
  }
}

const messages = ['Welcome', 'Hello World']

const simpleText = 'Hello World'
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    console.log('Optimized transformation:')
    console.log(result.code)

    // 应该只在顶层变量使用computed，内部使用t()
    expect(result.code).toContain('const config = computed(() => ({')
    expect(result.code).toContain('title: t("message.hello")')
    expect(result.code).toContain('primary: t("message.submit")')
    expect(result.code).toContain('secondary: t("message.cancel")')
    
    expect(result.code).toContain('const messages = computed(() => [')
    expect(result.code).toContain('t("message.welcome")')
    expect(result.code).toContain('t("message.hello")')
    
    expect(result.code).toContain('const simpleText = computed(() => t("message.hello"))')

    // 不应该有嵌套的computed在对象属性中
    expect(result.code).not.toContain('primary: computed(')
    expect(result.code).not.toContain('secondary: computed(')
    
    // 但是顶层变量的computed是正确的
    expect(result.code).toContain('const simpleText = computed(() => t("message.hello"))')
  })

  it('should handle ref and reactive variables correctly', async () => {
    const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const refMessage = ref('Hello World')
const reactiveConfig = reactive({
  title: 'Welcome',
  actions: {
    submit: 'Submit'
  }
})

const normalVar = 'Hello World'
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    console.log('Ref/Reactive transformation:')
    console.log(result.code)

    // ref应该转换为computed
    expect(result.code).toContain('const refMessage = computed(() => t("message.hello"))')
    expect(result.code).not.toContain('ref(')

    // reactive应该转换为computed
    expect(result.code).toContain('const reactiveConfig = computed(() => ({')
    expect(result.code).toContain('title: t("message.welcome")')
    expect(result.code).toContain('submit: t("message.submit")')
    expect(result.code).not.toContain('reactive(')

    // 普通变量正常处理
    expect(result.code).toContain('const normalVar = computed(() => t("message.hello"))')
  })

  it('should handle mixed ref, reactive and normal variables', async () => {
    const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
import { ref, reactive, computed as vueComputed } from 'vue'

const title = ref('Hello World')
const config = reactive({
  welcome: 'Welcome',
  nested: {
    submit: 'Submit'
  }
})
const existingComputed = vueComputed(() => 'Hello World')
const normalMessage = 'Welcome'
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    console.log('Mixed variables transformation:')
    console.log(result.code)

    // ref转换为computed
    expect(result.code).toMatch(/const title = computed\(\(\) => t\("message\.hello"\)\)/)
    
    // reactive转换为computed
    expect(result.code).toMatch(/const config = computed\(\(\) => \(\{/)
    expect(result.code).toContain('welcome: t("message.welcome")')
    expect(result.code).toContain('submit: t("message.submit")')
    
    // 已存在的computed应该被包装（因为它包含i18n字符串）
    expect(result.code).toContain('const existingComputed = computed(() => vueComputed(() => t("message.hello")))')
    
    // 普通变量正常处理
    expect(result.code).toMatch(/const normalMessage = computed\(\(\) => t\("message\.welcome"\)\)/)

    // 不应该有ref或reactive调用
    expect(result.code).not.toMatch(/ref\(.*t\(/)
    expect(result.code).not.toMatch(/reactive\(.*t\(/)
  })

  it('should preserve non-i18n content in ref and reactive', async () => {
    const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const userId = ref(123)
const userConfig = reactive({
  id: 456,
  theme: 'dark',
  message: 'Hello World'  // Only this should be transformed
})

const apiUrl = ref('/api/users')
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    console.log('Partial transformation:')
    console.log(result.code)

    // 数字和非匹配字符串应该保持原样
    expect(result.code).toContain('const userId = ref(123)')
    expect(result.code).toContain("const apiUrl = ref('/api/users')")
    
    // 只有匹配的字符串应该被转换
    expect(result.code).toContain('const userConfig = computed(() => ({')
    expect(result.code).toContain('id: 456')
    expect(result.code).toContain("theme: 'dark'")
    expect(result.code).toContain('message: t("message.hello")')
  })
}) 
