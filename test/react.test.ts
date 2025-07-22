import { describe, it, expect, beforeEach } from 'vitest'
import { ReactTransformer } from '../src/core/transformer/react'
import { ReactI18nextProvider } from '../src/core/providers/react-i18next'
import type { TransformOptions } from '../src/types'

describe('React Transformer', () => {
  let options: TransformOptions

  beforeEach(() => {
    options = {
      locale: {
        en: {
          greeting: 'Hello',
          message: {
            success: 'Success!',
            error: 'Error occurred',
            welcome: 'Welcome'
          }
        }
      }
    }
  })

  describe('Basic Transformation', () => {
    it('should transform JSX elements with text and attributes', async () => {
      const reactCode = `
import React from 'react'

export default function Component() {
  return (
    <div>
      <h1>Hello</h1>
      <p title="Success!">Error occurred</p>
      <input placeholder="Welcome" />
    </div>
  )
}
      `.trim()

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      // Should use Provider methods, not hardcoded t() calls
      expect(result.code).toContain('useTranslation')
      expect(result.code).toContain('const { t } = useTranslation()')
      expect(result.matches).toHaveLength(4)
      
      // Verify all matches are found
      const matchTexts = result.matches.map(m => m.original)
      expect(matchTexts).toContain('Hello')
      expect(matchTexts).toContain('Success!')
      expect(matchTexts).toContain('Error occurred')
      expect(matchTexts).toContain('Welcome')
    })

    it('should transform string literals in various contexts', async () => {
      const reactCode = `
const messages = ['Hello', 'Success!']
const config = { title: 'Error occurred' }
const result = useState('Hello')
      `.trim()
      
      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      // All string literals should be transformed via Provider
      expect(result.matches).toHaveLength(4) // 3 unique strings, but 'Hello' appears twice
    })

    it('should use default ReactI18nextProvider when no provider specified', async () => {
      const reactCode = `
export default function Component() {
  return <div>Hello</div>
}
      `.trim()
      
      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('useTranslation')
    })
  })

  describe('Complex Structures', () => {
    it('should handle nested objects and arrays', async () => {
      const reactCode = `
const config = {
  messages: {
    greeting: 'Hello',
    status: 'Success!'
  },
  labels: ['Welcome', 'Error occurred']
}
      `.trim()

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.matches).toHaveLength(4)
      const matchTexts = result.matches.map(m => m.original)
      expect(matchTexts).toContain('Hello')
      expect(matchTexts).toContain('Success!')
      expect(matchTexts).toContain('Welcome')
      expect(matchTexts).toContain('Error occurred')
    })

    it('should handle function parameters and return values', async () => {
      const reactCode = `
function getMessage(type) {
  const messages = {
    success: 'Success!',
    error: 'Error occurred'
  }
  return messages[type] || 'Hello'
}

const getWelcome = () => 'Welcome'
      `.trim()

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.matches).toHaveLength(4)
    })
  })

  describe('Custom Provider Support', () => {
    it('should support custom provider implementation', async () => {
      const customProvider = {
        createTranslationAst: (key: string) => ({
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'customT' },
          arguments: [{ type: 'StringLiteral', value: key }]
        }),
        getImportDeclarations: () => [{
          type: 'ImportDeclaration',
          specifiers: [{ type: 'ImportDefaultSpecifier', local: { type: 'Identifier', name: 'customT' } }],
          source: { type: 'StringLiteral', value: 'custom-i18n' }
        }]
      }

      const reactCode = `export default function Component() { return <div>Hello</div> }`
      
      const optionsWithCustomProvider: TransformOptions = {
        locale: options.locale,
        provider: customProvider as any
      }

      const transformer = new ReactTransformer(reactCode, optionsWithCustomProvider)
      const result = await transformer.transform()

      expect(result.code).toContain('customT')
      expect(result.code).toContain('custom-i18n')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid React code gracefully', async () => {
      const reactCode = `
export default function Component() {
  return <div>Hello
}
      `.trim() // Missing closing tag

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      // Should still attempt transformation and not crash
      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
    })

    it('should handle empty content gracefully', async () => {
      const reactCode = ``

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.matches).toHaveLength(0)
      expect(result.code).toBe('')
    })
  })
}) 
