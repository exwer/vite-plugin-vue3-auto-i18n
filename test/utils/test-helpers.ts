import type { LocaleConfig, TransformOptions } from '../../src/types'
import { expect } from 'vitest'

// 测试用的默认locale配置
export const testLocale: LocaleConfig = {
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
  zh: {
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

// 创建测试用的匹配函数
export function createTestMatcher(locale: LocaleConfig = testLocale) {
  return (text: string): string | false => {
    // 简单的匹配逻辑，在实际项目中应该使用更复杂的匹配
    for (const lang of Object.keys(locale)) {
      const langData = locale[lang]
      if (!langData) continue
      
      const result = searchInObject(langData, text)
      if (result) {
        return result
      }
    }
    return false
  }
}

// 递归搜索对象
function searchInObject(obj: any, value: string, currentPath: string = ''): string | false {
  for (const [key, val] of Object.entries(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key
    
    if (val === value) {
      return newPath
    }
    else if (typeof val === 'object' && val !== null) {
      const result = searchInObject(val, value, newPath)
      if (result) {
        return result
      }
    }
  }
  return false
}

// 创建测试用的转换选项
export function createTestOptions(overrides: Partial<TransformOptions> = {}): TransformOptions {
  return {
    locale: testLocale,
    enableScript: true,
    enableTemplate: true,
    debug: false,
    ...overrides
  }
}

// 测试用的Vue SFC模板
export const testVueSFC = `
<template>
  <div class="app">
    <h1>{{ title }}</h1>
    <p>hello world</p>
    <button>hi</button>
    <span>greetings</span>
  </div>
</template>

<script setup>
const title = 'hello world'
const buttonText = 'hi'
const greeting = 'greetings'
</script>
`

// 测试用的React JSX
export const testReactJSX = `
import React from 'react'

function App() {
  const title = 'hello world'
  const buttonText = 'hi'
  
  return (
    <div className="app">
      <h1>{title}</h1>
      <p>hello world</p>
      <button>{buttonText}</button>
      <span>greetings</span>
    </div>
  )
}
`

// 性能测试辅助函数
export function measurePerformance<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, time: end - start }
}

// 异步性能测试辅助函数
export async function measureAsyncPerformance<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return { result, time: end - start }
}

// 创建大文件用于性能测试
export function createLargeFile(size: number = 10000): string {
  const lines: string[] = []
  
  for (let i = 0; i < size; i++) {
    if (i % 10 === 0) {
      lines.push(`<p>hello world</p>`)
    } else if (i % 10 === 1) {
      lines.push(`<span>hi</span>`)
    } else if (i % 10 === 2) {
      lines.push(`<div>greetings</div>`)
    } else {
      lines.push(`<div>static content ${i}</div>`)
    }
  }
  
  return `
<template>
  <div class="large-app">
    ${lines.join('\n    ')}
  </div>
</template>

<script setup>
const title = 'hello world'
const subtitle = 'hi'
const description = 'greetings'
</script>
`
}

// 测试结果验证辅助函数
export function expectTransformedContent(result: string, expectedKeys: string[]): void {
  expectedKeys.forEach(key => {
    expect(result).toContain(`$t('${key}')`)
  })
}

export function expectNotTransformedContent(result: string, unexpectedKeys: string[]): void {
  unexpectedKeys.forEach(key => {
    expect(result).not.toContain(`$t('${key}')`)
  })
}

// 错误测试辅助函数
export function expectErrorWithCode(fn: () => any, expectedCode: string): void {
  try {
    fn()
    throw new Error('Expected function to throw an error')
  } catch (error: any) {
    expect(error.code).toBe(expectedCode)
  }
}

// 文件系统测试辅助函数
export function createMockFileSystem(files: Record<string, string>) {
  return {
    readFileSync: (path: string) => {
      if (files[path]) {
        return files[path]
      }
      throw new Error(`File not found: ${path}`)
    },
    writeFileSync: (path: string, content: string) => {
      files[path] = content
    },
    existsSync: (path: string) => {
      return path in files
    },
    mkdirSync: (path: string, options?: any) => {
      // Mock directory creation
    }
  }
} 
