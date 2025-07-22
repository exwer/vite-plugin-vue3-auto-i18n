import { describe, it, expect, beforeEach } from 'vitest'
import { VueTransformer } from '../src/core/transformer/vue'
import type { TransformOptions } from '../src/types'

describe('Vue Computed Transformation', () => {
  let options: TransformOptions

  beforeEach(() => {
    options = {
      locale: {
        en: {
          message: {
            hello: 'Hello World',
            welcome: 'Welcome to our app',
            clickMe: 'Click me'
          }
        }
      }
    }
  })

  it('should wrap script strings with computed() for reactivity', async () => {
    const sourceCode = `
<template>
  <div>{{ message }}</div>
</template>

<script setup>
const message = 'Hello World'
const buttonText = 'Click me'
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    // 检查是否导入了computed和useI18n
    expect(result.code).toMatch(/import.*computed.*from.*vue/)
    expect(result.code).toMatch(/import.*useI18n.*from.*vue-i18n/)
    
    // 检查是否添加了useI18n hook
    expect(result.code).toMatch(/const\s*\{[\s\S]*t[\s\S]*\}\s*=\s*useI18n\(\)/)
    
    // 检查script中的字符串是否被computed包装
    expect(result.code).toMatch(/computed\(\(\)\s*=>\s*t\("message\.hello"\)/)
    expect(result.code).toMatch(/computed\(\(\)\s*=>\s*t\("message\.clickMe"\)/)
    
    // 检查找到的匹配项
    expect(result.matches).toHaveLength(2)
    expect(result.matches.some(m => m.original === 'Hello World')).toBe(true)
    expect(result.matches.some(m => m.original === 'Click me')).toBe(true)
  })

  it('should use $t() in template without computed wrapper', async () => {
    const sourceCode = `
<template>
  <div>
    <h1>Hello World</h1>
    <p>Welcome to our app</p>
  </div>
</template>

<script setup>
// No script strings to transform
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    // 检查template中使用$t调用
    expect(result.code).toContain("{{ $t('message.hello') }}")
    expect(result.code).toContain("{{ $t('message.welcome') }}")
    
    // 检查没有导入computed（因为script中没有字符串需要转换）
    expect(result.code).not.toContain("import { computed } from 'vue'")
    
    // 检查找到的匹配项
    expect(result.matches).toHaveLength(2)
  })

  it('should handle mixed template and script strings correctly', async () => {
    const sourceCode = `
<template>
  <div>
    <h1>Hello World</h1>
    <button>{{ buttonText }}</button>
  </div>
</template>

<script setup>
const buttonText = 'Click me'
const apiUrl = '/api/users'  // This should not be transformed
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    // 检查template使用$t
    expect(result.code).toContain("{{ $t('message.hello') }}")
    
    // 检查script使用computed包装
    expect(result.code).toMatch(/computed\(\(\)\s*=>\s*t\("message\.clickMe"\)/)
    
    // 检查API URL没有被转换（因为不在locale中）
    expect(result.code).toContain("'/api/users'")
    
    // 检查导入和hook
    expect(result.code).toMatch(/import.*computed.*from.*vue/)
    expect(result.code).toMatch(/import.*useI18n.*from.*vue-i18n/)
    expect(result.code).toMatch(/const\s*\{[\s\S]*t[\s\S]*\}\s*=\s*useI18n\(\)/)
    
    // 检查找到的匹配项数量
    expect(result.matches).toHaveLength(2)
    expect(result.matches.some(m => m.original === 'Hello World')).toBe(true)
    expect(result.matches.some(m => m.original === 'Click me')).toBe(true)
  })

  it('should handle Vue directives with computed in script', async () => {
    const sourceCode = `
<template>
  <div>
    <p v-text="'Welcome to our app'"></p>
    <div v-html="'<strong>Hello World</strong>'"></div>
  </div>
</template>

<script setup>
const greeting = 'Hello World'
</script>
    `.trim()

    const transformer = new VueTransformer(sourceCode, options)
    const result = await transformer.transform()

    // 检查template中的指令转换
    expect(result.code).toContain('v-text="$t(\'message.welcome\')"')
    expect(result.code).toContain('v-html="$t(\'message.hello\')"')
    
    // 检查script中使用computed
    expect(result.code).toMatch(/computed\(\(\)\s*=>\s*t\("message\.hello"\)/)
    
    // 检查导入
    expect(result.code).toMatch(/import.*computed.*from.*vue/)
    expect(result.code).toMatch(/import.*useI18n.*from.*vue-i18n/)
    
    // 应该找到3个匹配项（2个template + 1个script）
    expect(result.matches).toHaveLength(3)
  })
}) 
