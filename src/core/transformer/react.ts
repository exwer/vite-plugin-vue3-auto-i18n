import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { generate } from '@babel/generator'
import { BaseTransformer } from './base'
import { ReactI18nextProvider } from '../providers/react-i18next'
import type { TransformOptions, TransformResult, TextMatch } from '../../types'
import { createError, ErrorCode } from '../errors'

export class ReactTransformer extends BaseTransformer {
  private ast: any

  constructor(sourceCode: string, options: TransformOptions) {
    super(sourceCode, options)
    // 如果没有提供provider，使用默认的ReactI18nextProvider
    if (!this.context.provider) {
      this.context.provider = ReactI18nextProvider
    }
  }

  protected parse(): any {
    try {
      this.ast = parse(this.context.sourceCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      })
      return this.ast
    } catch (error) {
      throw createError(
        ErrorCode.PARSE_ERROR,
        'Failed to parse React JSX',
        { originalError: error as Error }
      )
    }
  }

  protected transformAST(ast: any): any {
    if (!ast) return this.context.sourceCode

    let needsTImport = false
    let hasTImport = false

    // 使用箭头函数确保this绑定正确
    const isMatchedStr = (text: string) => this.isMatchedStr(text)
    const addMatch = (original: string, key: string, type: string) => this.addMatch(original, key, type)
    const provider = this.context.provider

    // 遍历AST进行转换
    traverse(ast, {
      // 处理JSX文本节点
      JSXText(path: NodePath<t.JSXText>) {
        const text = path.node.value.trim()
        if (text && text !== '\n' && text !== ' ') {
          const key = isMatchedStr(text)
          if (key) {
            addMatch(text, key, 'jsx-text')
            if (provider) {
              const translationAst = provider.createTranslationAst(key)
              path.replaceWith(t.jsxExpressionContainer(translationAst))
              needsTImport = true
            }
          }
        }
      },

      // 处理JSX属性
      JSXAttribute(path: NodePath<t.JSXAttribute>) {
        if (path.node.value && t.isStringLiteral(path.node.value)) {
          const text = path.node.value.value
          const key = isMatchedStr(text)
          if (key) {
            addMatch(text, key, 'jsx-attribute')
            if (provider) {
              const translationAst = provider.createTranslationAst(key)
              path.node.value = t.jsxExpressionContainer(translationAst)
              needsTImport = true
            }
          }
        }
      },

      // 处理字符串字面量
      StringLiteral(path: NodePath<t.StringLiteral>) {
        // 跳过 import ... from 'xxx'
        const parent = path.parent
        if (parent && 'node' in parent && t.isImportDeclaration(parent.node as t.Node)) {
          return
        }

        const value = path.node.value
        const key = isMatchedStr(value)
        
        if (key && provider) {
          addMatch(value, key, 'string-literal')
          
          // 检查是否在 useState 调用中
          if (
            parent && 
            'node' in parent &&
            t.isCallExpression(parent.node as t.Node) &&
            t.isIdentifier(parent.node.callee) &&
            parent.node.callee.name === 'useState'
          ) {
            // 对于 useState，使用基本的翻译AST
            const translationAst = provider.createTranslationAst(key)
            path.replaceWith(translationAst)
          } else {
            // 其他情况使用scoped翻译AST（如果可用）
            if (provider.createScopedTranslationAst) {
              const scopedAst = provider.createScopedTranslationAst(key)
              path.replaceWith(scopedAst as any)
            } else {
              const translationAst = provider.createTranslationAst(key)
              path.replaceWith(translationAst)
            }
          }
          needsTImport = true
        }
      },

      // 处理模板字符串
      TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
        // 只处理简单的模板字符串（没有插值）
        if (path.node.expressions.length === 0 && path.node.quasis.length === 1) {
          const text = path.node.quasis[0].value.raw
          const key = isMatchedStr(text)
          if (key && provider) {
            addMatch(text, key, 'template-literal')
            const translationAst = provider.createTranslationAst(key)
            path.replaceWith(translationAst)
            needsTImport = true
          }
        }
      },

      // 处理数组表达式
      ArrayExpression(path: NodePath<t.ArrayExpression>) {
        path.node.elements.forEach((element, index) => {
          if (t.isStringLiteral(element)) {
            const key = isMatchedStr(element.value)
            if (key && provider) {
              addMatch(element.value, key, 'array-element')
              const translationAst = provider.createTranslationAst(key)
              path.node.elements[index] = translationAst
              needsTImport = true
            }
          }
        })
      },

      // 处理对象表达式
      ObjectExpression(path: NodePath<t.ObjectExpression>) {
        path.node.properties.forEach((prop) => {
          if (t.isObjectProperty(prop) && t.isStringLiteral(prop.value)) {
            const key = isMatchedStr(prop.value.value)
            if (key && provider) {
              addMatch(prop.value.value, key, 'object-property')
              const translationAst = provider.createTranslationAst(key)
              prop.value = translationAst
              needsTImport = true
            }
          }
        })
      },

      // 处理导入声明
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const source = path.node.source.value
        if (source === 'react-i18next') {
          hasTImport = true
          path.node.specifiers.forEach((specifier) => {
            if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported) && specifier.imported.name === 'useTranslation') {
              // 确保导入了 t 函数
              const tSpecifier = t.importSpecifier(
                t.identifier('t'),
                t.identifier('t')
              )
              if (!path.node.specifiers.some(s => 
                t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === 't'
              )) {
                path.node.specifiers.push(tSpecifier)
              }
            }
          })
        }
      }
    })

    // 如果需要 t 函数但没有导入，使用provider添加导入
    if (needsTImport && !hasTImport && provider) {
      const importDeclarations = provider.getImportDeclarations?.() || []
      const hookDeclarations = provider.getHookDeclarations?.() || []
      
      // 添加import声明到文件开头
      importDeclarations.forEach(importDecl => {
        ast.program.body.unshift(importDecl)
      })
      
      // 找到第一个非import语句的位置，插入hook声明
      let insertIndex = 0
      for (let i = 0; i < ast.program.body.length; i++) {
        if (!t.isImportDeclaration(ast.program.body[i])) {
          insertIndex = i
          break
        }
      }
      
      // 在找到的位置插入hook声明
      hookDeclarations.forEach((hookDecl, index) => {
        ast.program.body.splice(insertIndex + index, 0, hookDecl)
      })
    }

    return ast
  }

  protected generate(ast: any): string {
    if (!ast) return this.context.sourceCode

    try {
      const result = generate(ast, {
        retainLines: true,
        compact: false
      })
      return result.code
    } catch (error) {
      throw createError(
        ErrorCode.TRANSFORM_ERROR,
        'Failed to generate React code',
        { originalError: error }
      )
    }
  }

  private getDefaultFormat() {
    return {
      template: (key: string) => `{t('${key}')}`,
      script: (key: string) => `useMemo(() => t('${key}'), [t])`,
      interpolation: (key: string) => `t('${key}')`
    }
  }
} 
