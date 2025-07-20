import { describe, it, expect, vi } from 'vitest'
import { createUnplugin } from '../src/plugins/unplugin'
import { createVitePlugin } from '../src/plugins/vite'
import { createWebpackPlugin } from '../src/plugins/webpack'

describe('Plugin System', () => {
  const mockLocale = {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome',
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel'
        },
        errors: {
          required: 'This field is required'
        },
        placeholder: {
          name: 'Enter your name'
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
        },
        errors: {
          required: '此字段为必填项'
        },
        placeholder: {
          name: '请输入您的姓名'
        }
      }
    }
  }

  describe('Unplugin Plugin', () => {
    it('should create unplugin with correct configuration', () => {
      const plugin = createUnplugin({
        locale: mockLocale,
        include: ['**/*.{js,jsx,ts,tsx}'],
        exclude: ['**/node_modules/**']
      })

      expect(plugin.name).toBe('i18ncraft')
      expect(plugin.transformInclude).toBeDefined()
      expect(plugin.transform).toBeDefined()
    })

    it('should transform Vue files', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const source = `
<template>
  <div>Hello World</div>
</template>
`
      const result = await plugin.transform!(source, 'test.vue')
      expect(result).toBeDefined()
      expect(result?.code).toContain('$t(\'message.hello\')')
    })

    it('should transform React files', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const source = `
import React from 'react'
function App() {
  return <div>Hello World</div>
}
`
      const result = await plugin.transform!(source, 'test.jsx')
      expect(result).toBeDefined()
      expect(result?.code).toContain('{t(\'message.hello\')}')
    })

    it('should skip non-matching files', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const source = `console.log('hello world')`
      const result = await plugin.transform!(source, 'test.css')
      expect(result).toBeNull()
    })
  })

  describe('Vite Plugin', () => {
    it('should create vite plugin with correct configuration', () => {
      const plugin = createVitePlugin({
        locale: mockLocale,
        include: ['**/*.{vue,js,jsx,ts,tsx}']
      })

      expect(plugin.name).toBe('i18ncraft')
      expect(plugin.transform).toBeDefined()
      expect(plugin.configResolved).toBeDefined()
    })

    it('should transform Vue files in Vite', async () => {
      const plugin = createVitePlugin({ locale: mockLocale })
      const source = `
<template>
  <div>Hello World</div>
</template>
`
      const result = await plugin.transform!(source, 'test.vue')
      expect(result).toBeDefined()
      expect(result?.code).toContain('$t(\'message.hello\')')
    })

    it('should handle Vite config resolution', () => {
      const plugin = createVitePlugin({ locale: mockLocale })
      const mockConfig = {
        plugins: [],
        root: '/test'
      }
      
      expect(() => {
        plugin.configResolved?.(mockConfig as any)
      }).not.toThrow()
    })
  })

  describe('Webpack Plugin', () => {
    it('should create webpack plugin with correct configuration', () => {
      const plugin = createWebpackPlugin({
        locale: mockLocale,
        include: ['**/*.{vue,js,jsx,ts,tsx}']
      })

      expect(plugin.name).toBe('I18nCraftWebpackPlugin')
      expect(plugin.apply).toBeDefined()
    })

    it('should apply webpack plugin correctly', () => {
      const plugin = createWebpackPlugin({ locale: mockLocale })
      const mockCompiler = {
        hooks: {
          compilation: {
            tap: vi.fn(),
            call: vi.fn()
          }
        }
      }

      expect(() => {
        plugin.apply(mockCompiler as any)
      }).not.toThrow()
    })

    it('should handle webpack compilation', () => {
      const plugin = createWebpackPlugin({ locale: mockLocale })
      const mockCompilation = {
        assets: {},
        errors: [],
        warnings: []
      }

      // Mock the compilation process
      const mockCompiler = {
        hooks: {
          compilation: {
            tap: vi.fn((name, callback) => {
              callback(mockCompilation)
            })
          }
        }
      }

      expect(() => {
        plugin.apply(mockCompiler as any)
      }).not.toThrow()
    })
  })

  describe('Plugin Configuration', () => {
    it('should handle custom include patterns', () => {
      const plugin = createUnplugin({
        locale: mockLocale,
        include: ['**/*.vue', '**/components/**/*.{js,jsx}']
      })

      expect(plugin.transformInclude).toBeDefined()
      
      // Test include patterns
      const includeFn = plugin.transformInclude!

      expect(includeFn('test.vue')).toBe(true)
      expect(includeFn('components/Button.jsx')).toBe(true)
      expect(includeFn('utils/helper.js')).toBe(false)
    })

    it('should handle custom exclude patterns', () => {
      const plugin = createUnplugin({
        locale: mockLocale,
        exclude: ['**/node_modules/**', '**/dist/**']
      })

      const includeFn = plugin.transformInclude!
      expect(includeFn('node_modules/react/index.js')).toBe(false)
      expect(includeFn('dist/bundle.js')).toBe(false)
      expect(includeFn('src/App.vue')).toBe(true)
    })

    it('should handle custom transform format', async () => {
      const customFormat = {
        template: (key: string) => `i18n.get('${key}')`,
        script: (key: string) => `useI18nText('${key}')`,
        interpolation: (key: string) => `i18n.get('${key}')`
      }

      const plugin = createUnplugin({
        locale: mockLocale,
        transformFormat: customFormat
      })

      const source = `
<template>
  <div>Hello World</div>
</template>
`
      const result = await plugin.transform!(source, 'test.vue')
      expect(result?.code).toContain('i18n.get(\'message.hello\')')
    })
  })

  describe('Error Handling', () => {
    it('should handle transformation errors gracefully', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const invalidSource = `
<template>
  <div>hello world
  <p>welcome
</template>
`
      const result = await plugin.transform!(invalidSource, 'test.vue')
      expect(result).toBeDefined()
      expect(result?.code).toBe(invalidSource) // Should return original code on error
    })

    it('should handle missing locale configuration', () => {
      expect(() => {
        createUnplugin({} as any)
      }).toThrow()
    })

    it('should handle invalid file paths', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const result = await plugin.transform!('test', '')
      expect(result).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should handle large files efficiently', async () => {
      const plugin = createUnplugin({ locale: mockLocale })
      const largeSource = `
<template>
  <div>
    ${Array(100).fill(0).map((_, i) => `<p key="${i}">hello world</p>`).join('\n    ')}
  </div>
</template>
`
      const startTime = Date.now()
      const result = await plugin.transform!(largeSource, 'large.vue')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result).toBeDefined()
    })
  })
}) 
