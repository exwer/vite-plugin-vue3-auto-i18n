import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { generate } from '@babel/generator'
import { BaseTransformer } from './base'
import type { TransformOptions, TransformResult, TextMatch } from '../../types'
import { createError, ErrorCode } from '../../utils/errors'

export class ReactTransformer extends BaseTransformer {
  private transformFormat: any
  private ast: any

  constructor(sourceCode: string, options: TransformOptions) {
    super(sourceCode, options)
    this.transformFormat = options.transformFormat || this.getDefaultFormat()
  }

  protected parse(): any {
    try {
      // 检查是否包含JSX
      if (!this.context.sourceCode.includes('<') || !this.context.sourceCode.includes('>')) {
        return null
      }

      this.ast = parse(this.context.sourceCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      })
      return this.ast
    } catch (error) {
      throw createError(
        ErrorCode.PARSE_ERROR,
        'Failed to parse React JSX',
        { originalError: error }
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

    // 遍历AST进行转换
    traverse(ast, {
      // 处理JSX文本节点
      JSXText(path: NodePath<t.JSXText>) {
        const text = path.node.value.trim()
        if (text && text !== '\n' && text !== ' ') {
          const key = isMatchedStr(text)
          if (key) {
            addMatch(text, key, 'jsx-text')
            path.replaceWith(
              t.jsxExpressionContainer(
                t.callExpression(
                  t.identifier('t'),
                  [t.stringLiteral(key)]
                )
              )
            )
            needsTImport = true
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
            path.node.value = t.jsxExpressionContainer(
              t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
            )
            needsTImport = true
          }
        }
      },

      // 处理字符串字面量
      StringLiteral(path: NodePath<t.StringLiteral>) {
        // 跳过 import ... from 'xxx'
        const parent = path.parent
        if (parent && 'node' in parent && t.isImportDeclaration(parent.node)) {
          return
        }

        const value = path.node.value
        const key = isMatchedStr(value)
        
        if (key) {
          addMatch(value, key, 'string-literal')
          
          // 检查是否在 useState 调用中
          if (
            parent && 
            'node' in parent &&
            t.isCallExpression(parent.node) &&
            t.isIdentifier(parent.node.callee) &&
            parent.node.callee.name === 'useState'
          ) {
            path.replaceWith(
              t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
            )
          } else {
            // 其他情况包装在 useMemo 中
            path.replaceWith(
              t.callExpression(
                t.identifier('useMemo'),
                [
                  t.arrowFunctionExpression(
                    [],
                    t.callExpression(
                      t.identifier('t'),
                      [t.stringLiteral(key)]
                    )
                  ),
                  t.arrayExpression([t.identifier('t')])
                ]
              )
            )
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
          if (key) {
            addMatch(text, key, 'template-literal')
            path.replaceWith(
              t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
            )
            needsTImport = true
          }
        }
      },

      // 处理数组表达式
      ArrayExpression(path: NodePath<t.ArrayExpression>) {
        path.node.elements.forEach((element, index) => {
          if (t.isStringLiteral(element)) {
            const key = isMatchedStr(element.value)
            if (key) {
              addMatch(element.value, key, 'array-element')
              path.node.elements[index] = t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
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
            if (key) {
              addMatch(prop.value.value, key, 'object-property')
              prop.value = t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
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

    // 如果需要 t 函数但没有导入，添加导入
    if (needsTImport && !hasTImport) {
      const importDeclaration = t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier('useTranslation'),
            t.identifier('useTranslation')
          ),
          t.importSpecifier(
            t.identifier('t'),
            t.identifier('t')
          )
        ],
        t.stringLiteral('react-i18next')
      )
      ast.program.body.unshift(importDeclaration)
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
