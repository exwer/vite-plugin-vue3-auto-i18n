import { describe, expect, test } from 'vitest'
import { TextMatcher } from '../src/core/matcher'
import { VueI18nProvider } from '../src/core/providers/vue-i18n'
import { ReactI18nextProvider } from '../src/core/providers/react-i18next'
import * as t from '@babel/types'

describe('Core Components', () => {
  const locale = {
    en: {
      greeting: 'Hello',
      message: {
        success: 'Success!',
        error: 'Error occurred'
      },
      nested: {
        deep: {
          value: 'Deep value'
        }
      }
    }
  }

  describe('TextMatcher', () => {
    test('should match text and return correct key path', () => {
      const matcher = new TextMatcher(locale)
      
      expect(matcher.match('Hello')).toBe('greeting')
      expect(matcher.match('Success!')).toBe('message.success')
      expect(matcher.match('Error occurred')).toBe('message.error')
      expect(matcher.match('Deep value')).toBe('nested.deep.value')
      expect(matcher.match('Non-existent')).toBe(false)
    })

    test('should handle empty or whitespace text', () => {
      const matcher = new TextMatcher(locale)
      
      expect(matcher.match('')).toBe(false)
      expect(matcher.match('   ')).toBe(false)
      expect(matcher.match('\n')).toBe(false)
      expect(matcher.match('\t')).toBe(false)
    })

    test('should be case sensitive', () => {
      const matcher = new TextMatcher(locale)
      
      expect(matcher.match('hello')).toBe(false) // lowercase
      expect(matcher.match('Hello')).toBe('greeting') // correct case
    })
  })

  describe('VueI18nProvider', () => {
    test('should create correct translation AST', () => {
      const ast = VueI18nProvider.createTranslationAst('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      expect(t.isMemberExpression(ast.callee)).toBe(true)
      if (t.isMemberExpression(ast.callee)) {
        expect(t.isIdentifier(ast.callee.object) && ast.callee.object.name).toBe('this')
        expect(t.isIdentifier(ast.callee.property) && ast.callee.property.name).toBe('$t')
      }
      expect(ast.arguments).toHaveLength(1)
      expect(t.isStringLiteral(ast.arguments[0]) && ast.arguments[0].value).toBe('greeting')
    })

    test('should not provide import or hook declarations', () => {
      expect(VueI18nProvider.getImportDeclarations).toBeUndefined()
      expect(VueI18nProvider.getHookDeclarations).toBeUndefined()
      expect(VueI18nProvider.createScopedTranslationAst).toBeUndefined()
    })
  })

  describe('ReactI18nextProvider', () => {
    test('should create correct translation AST', () => {
      const ast = ReactI18nextProvider.createTranslationAst('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      expect(t.isIdentifier(ast.callee) && ast.callee.name).toBe('t')
      expect(ast.arguments).toHaveLength(1)
      expect(t.isStringLiteral(ast.arguments[0]) && ast.arguments[0].value).toBe('greeting')
    })

    test('should create scoped translation AST with useMemo', () => {
      const ast = ReactI18nextProvider.createScopedTranslationAst!('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      if (t.isCallExpression(ast)) {
        expect(t.isIdentifier(ast.callee) && ast.callee.name).toBe('useMemo')
        expect(ast.arguments).toHaveLength(2)
      }
    })

    test('should provide correct import declarations', () => {
      const imports = ReactI18nextProvider.getImportDeclarations!()
      
      expect(imports).toHaveLength(1)
      expect(t.isImportDeclaration(imports[0])).toBe(true)
      expect(t.isStringLiteral(imports[0].source) && imports[0].source.value).toBe('react-i18next')
    })

    test('should provide correct hook declarations', () => {
      const hooks = ReactI18nextProvider.getHookDeclarations!()
      
      expect(hooks).toHaveLength(1)
      expect(t.isVariableDeclaration(hooks[0])).toBe(true)
    })
  })
}) 
