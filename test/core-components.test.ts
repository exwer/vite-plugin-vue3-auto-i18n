import { describe, it, expect, beforeEach } from 'vitest'
import * as t from '@babel/types'
import { TextMatcher } from '../src/core/matcher'
import { VueI18nProvider } from '../src/core/providers/vue-i18n'
import { ReactI18nextProvider } from '../src/core/providers/react-i18next'
import type { LocaleConfig } from '../src/types'

describe('Core Components', () => {
  describe('TextMatcher', () => {
    let matcher: TextMatcher
    let locale: LocaleConfig

    beforeEach(() => {
      locale = {
        en: {
          greeting: 'Hello',
          nested: {
            message: 'World'
          }
        }
      }
      matcher = new TextMatcher(locale)
    })

    it('should match text and return correct key path', () => {
      expect(matcher.match('Hello')).toBe('greeting')
      expect(matcher.match('World')).toBe('nested.message')
    })

    it('should handle empty or whitespace text', () => {
      expect(matcher.match('')).toBe(false)
      expect(matcher.match('   ')).toBe(false)
      expect(matcher.match('\n\t')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(matcher.match('hello')).toBe(false) // lowercase
      expect(matcher.match('Hello')).toBe('greeting') // correct case
    })

    it('should return false for non-matching text', () => {
      expect(matcher.match('Non-existent text')).toBe(false)
      expect(matcher.match('Random string')).toBe(false)
    })
  })

  describe('VueI18nProvider', () => {
    it('should create computed-wrapped translation AST for script by default', () => {
      const ast = VueI18nProvider.createTranslationAst('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      if (t.isCallExpression(ast)) {
        // Should be computed() call
        expect(t.isIdentifier(ast.callee) && ast.callee.name).toBe('computed')
        expect(ast.arguments).toHaveLength(1)
        
        // First argument should be arrow function
        const arrowFunc = ast.arguments[0]
        expect(t.isArrowFunctionExpression(arrowFunc)).toBe(true)
      }
    })

    it('should create scoped translation AST for template vs script', () => {
      // Template scope should use $t
      const templateAst = VueI18nProvider.createScopedTranslationAst!('greeting', 'template')
      expect(t.isCallExpression(templateAst)).toBe(true)
      if (t.isCallExpression(templateAst)) {
        expect(t.isMemberExpression(templateAst.callee)).toBe(true)
        if (t.isMemberExpression(templateAst.callee)) {
          expect(t.isThisExpression(templateAst.callee.object)).toBe(true)
          expect(t.isIdentifier(templateAst.callee.property) && templateAst.callee.property.name).toBe('$t')
        }
      }

      // Script scope should use simple t() call (computed wrapping happens at higher level)
      const scriptAst = VueI18nProvider.createScopedTranslationAst!('greeting', 'script')
      expect(t.isCallExpression(scriptAst)).toBe(true)
      if (t.isCallExpression(scriptAst)) {
        expect(t.isIdentifier(scriptAst.callee) && scriptAst.callee.name).toBe('t')
      }
    })

    it('should provide import and hook declarations', () => {
      expect(VueI18nProvider.getImportDeclarations).toBeDefined()
      expect(VueI18nProvider.getHookDeclarations).toBeDefined()
      expect(VueI18nProvider.createScopedTranslationAst).toBeDefined()
      
      const imports = VueI18nProvider.getImportDeclarations!()
      expect(imports).toHaveLength(2)
      
      const hooks = VueI18nProvider.getHookDeclarations!()
      expect(hooks).toHaveLength(1)
    })
  })

  describe('ReactI18nextProvider', () => {
    it('should create correct translation AST', () => {
      const ast = ReactI18nextProvider.createTranslationAst('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      if (t.isCallExpression(ast)) {
        expect(t.isIdentifier(ast.callee) && ast.callee.name).toBe('t')
        expect(ast.arguments).toHaveLength(1)
        expect(t.isStringLiteral(ast.arguments[0]) && ast.arguments[0].value).toBe('greeting')
      }
    })

    it('should create scoped translation AST with useMemo', () => {
      const ast = ReactI18nextProvider.createScopedTranslationAst!('greeting')
      
      expect(t.isCallExpression(ast)).toBe(true)
      if (t.isCallExpression(ast)) {
        expect(t.isIdentifier(ast.callee) && ast.callee.name).toBe('useMemo')
        expect(ast.arguments).toHaveLength(2)
        
        // First argument should be arrow function
        const arrowFunc = ast.arguments[0]
        expect(t.isArrowFunctionExpression(arrowFunc)).toBe(true)
        
        // Second argument should be dependency array
        const deps = ast.arguments[1]
        expect(t.isArrayExpression(deps)).toBe(true)
      }
    })

    it('should provide correct import declarations', () => {
      const imports = ReactI18nextProvider.getImportDeclarations!()
      expect(imports).toHaveLength(1)
      
      // Should import useTranslation
      const importSources = imports.map(imp => imp.source.value)
      expect(importSources).toContain('react-i18next')
    })

    it('should provide correct hook declarations', () => {
      const hooks = ReactI18nextProvider.getHookDeclarations!()
      expect(hooks).toHaveLength(1)
      
      const hookDecl = hooks[0]
      expect(t.isVariableDeclaration(hookDecl)).toBe(true)
    })
  })
}) 
 