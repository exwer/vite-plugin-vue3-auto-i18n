import { describe, expect, test } from 'vitest'
import { VueTransformer, ReactTransformer, JavaScriptTransformer } from '../src/core/transformer'
import { VueI18nProvider } from '../src/core/providers/vue-i18n'
import { ReactI18nextProvider } from '../src/core/providers/react-i18next'
import { VanillaI18nextProvider, VanillaFunctionProvider, createVanillaProvider } from '../src/core/providers/vanilla-js'
import type { TransformOptions } from '../src/types'

describe('Transformer Architecture', () => {
  const locale = {
    en: {
      greeting: 'Hello',
      message: {
        success: 'Success!',
        error: 'Error occurred'
      }
    }
  }

  describe('VueTransformer with VueI18nProvider', () => {
    test('should transform Vue SFC with template and script', async () => {
      const vueCode = `
<template>
  <div>
    <h1>Hello</h1>
    <p>Success!</p>
  </div>
</template>

<script>
export default {
  name: 'TestComponent'
}
</script>
`
      
      const options: TransformOptions = {
        locale,
        provider: VueI18nProvider
      }

      const transformer = new VueTransformer(vueCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('$t(\'greeting\')')
      expect(result.code).toContain('$t(\'message.success\')')
      expect(result.matches).toHaveLength(2)
      expect(result.matches[0].original).toBe('Hello')
      expect(result.matches[0].key).toBe('greeting')
      expect(result.matches[1].original).toBe('Success!')
      expect(result.matches[1].key).toBe('message.success')
    })

    test('should use default VueI18nProvider when no provider specified', async () => {
      const vueCode = `
<template>
  <div>Hello</div>
</template>
`
      
      const options: TransformOptions = {
        locale
        // no provider specified, should use default VueI18nProvider
      }

      const transformer = new VueTransformer(vueCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('$t(\'greeting\')')
    })
  })

  describe('ReactTransformer with ReactI18nextProvider', () => {
    test('should transform JSX elements completely via Provider', async () => {
      const reactCode = `
import React from 'react'

export default function Component() {
  return (
    <div>
      <h1>Hello</h1>
      <p title="Success!">Error occurred</p>
    </div>
  )
}
`
      
      const options: TransformOptions = {
        locale,
        provider: ReactI18nextProvider
      }

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      // Should use Provider methods, not hardcoded t() calls
      expect(result.code).toContain('useTranslation')
      expect(result.code).toContain('const { t } = useTranslation()')
      expect(result.matches).toHaveLength(3)
      
      // Verify all matches are found
      const matchTexts = result.matches.map(m => m.original)
      expect(matchTexts).toContain('Hello')
      expect(matchTexts).toContain('Success!')
      expect(matchTexts).toContain('Error occurred')
    })

    test('should transform string literals in various contexts', async () => {
      const reactCode = `
const messages = ['Hello', 'Success!']
const config = { title: 'Error occurred' }
const result = useState('Hello')
`
      
      const options: TransformOptions = {
        locale,
        provider: ReactI18nextProvider
      }

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      // All string literals should be transformed via Provider
      expect(result.matches).toHaveLength(4) // 3 unique strings, but 'Hello' appears twice
    })

    test('should use default ReactI18nextProvider when no provider specified', async () => {
      const reactCode = `
export default function Component() {
  return <div>Hello</div>
}
`
      
      const options: TransformOptions = {
        locale
        // no provider specified, should use default ReactI18nextProvider
      }

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('useTranslation')
    })
  })

  describe('Custom Provider Support', () => {
    test('should support custom provider implementation', async () => {
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
      
      const options: TransformOptions = {
        locale,
        provider: customProvider as any
      }

      const transformer = new ReactTransformer(reactCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('customT')
      expect(result.code).toContain('custom-i18n')
    })
  })

  describe('JavaScriptTransformer with Vanilla Providers', () => {
    test('should transform JavaScript code with VanillaI18nextProvider', async () => {
      const jsCode = `
const message = 'Hello'
const config = { title: 'Success!' }
`
      
      const options: TransformOptions = {
        locale,
        provider: VanillaI18nextProvider
      }

      const transformer = new JavaScriptTransformer(jsCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('i18next.t(')
      expect(result.code).toContain('import i18next from "i18next"')
      expect(result.matches).toHaveLength(2)
    })

    test('should use custom vanilla provider', async () => {
      const customProvider = createVanillaProvider({
        functionName: 'getText',
        objectName: 'i18n',
        importPath: '@/utils/i18n',
        importType: 'named'
      })

      const jsCode = `const message = 'Hello'`
      
      const options: TransformOptions = {
        locale,
        provider: customProvider
      }

      const transformer = new JavaScriptTransformer(jsCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('i18n.getText(')
      expect(result.code).toContain('import { i18n } from "@/utils/i18n"')
    })
  })
}) 
