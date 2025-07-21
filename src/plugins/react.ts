import { parse } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { generate } from '@babel/generator'
import { getMatchedMsgPath } from '../utils'
import { createError, ErrorCode } from '../core/errors'
import type { LocaleConfig, TransformFormat, TextMatch, TransformResult } from '../types'

const DEFAULT_REACT_FORMAT: TransformFormat = {
  template: (key) => `{t('${key}')}`,
  script: (key) => `useMemo(() => t('${key}'), [t])`,
  interpolation: (key) => `t('${key}')`
}

// 简化的匹配函数
function matchText(text: string, locale: LocaleConfig): string | false {
  // 先尝试精确匹配
  let result = getMatchedMsgPath(locale, text)
  if (result) return result
  
  // 尝试忽略大小写匹配
  const languages = Object.keys(locale)
  for (const lang of languages) {
    const langData = locale[lang]
    if (!langData) continue
    
    // 递归搜索，忽略大小写
    const searchInObject = (obj: any, currentPath: string = ''): string => {
      for (const [key, val] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        
        if (typeof val === 'string' && val.toLowerCase() === text.toLowerCase()) {
          return newPath
        }
        else if (typeof val === 'object' && val !== null) {
          const result = searchInObject(val, newPath)
          if (result) {
            return result
          }
        }
      }
      return ''
    }
    
    result = searchInObject(langData)
    if (result) return result
  }
  
  return false
}

export function transformReact(
  source: string,
  options: {
    locale: LocaleConfig
    transformFormat?: TransformFormat
  }
): TransformResult {
  const { locale, transformFormat = DEFAULT_REACT_FORMAT } = options
  const matches: TextMatch[] = []
  const errors: Error[] = []

  try {
    // 检查是否包含JSX
    if (!source.includes('<') || !source.includes('>')) {
      return {
        code: source,
        matches: [],
        errors: []
      }
    }

    // 解析代码
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    })

    // 检查是否需要导入t函数
    let needsTImport = false
    let hasTImport = false

    // 遍历AST进行转换
    traverse(ast, {
      // 处理JSX文本节点
      JSXText(path: NodePath<t.JSXText>) {
        const text = path.node.value.trim()
        if (text && text !== '\n' && text !== ' ') {
          const key = matchText(text, locale)
          if (key) {
            matches.push({
              original: text,
              key,
              type: 'jsx-text'
            })
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
        const value = path.node.value
        if (t.isStringLiteral(value)) {
          const key = matchText(value.value, locale)
          if (key) {
            matches.push({
              original: value.value,
              key,
              type: 'jsx-attribute'
            })
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
        // 跳过已经在JSX中处理过的
        if (path.parent && t.isJSXExpressionContainer(path.parent)) {
          return
        }

        const key = matchText(path.node.value, locale)
        if (key) {
          matches.push({
            original: path.node.value,
            key,
            type: 'string-literal'
          })
          path.replaceWith(
            t.callExpression(
              t.identifier('t'),
              [t.stringLiteral(key)]
            )
          )
          needsTImport = true
        }
      },

      // 处理模板字面量
      TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
        if (path.node.quasis.length === 1 && path.node.expressions.length === 0) {
          const text = path.node.quasis[0].value.raw
          const key = matchText(text, locale)
          if (key) {
            matches.push({
              original: text,
              key,
              type: 'template-literal'
            })
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

      // 处理数组字面量
      ArrayExpression(path: NodePath<t.ArrayExpression>) {
        path.node.elements.forEach((element, index) => {
          if (t.isStringLiteral(element)) {
            const key = matchText(element.value, locale)
            if (key) {
              matches.push({
                original: element.value,
                key,
                type: 'array-element'
              })
              path.node.elements[index] = t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
              needsTImport = true
            }
          }
        })
      },

      // 处理对象字面量
      ObjectExpression(path: NodePath<t.ObjectExpression>) {
        path.node.properties.forEach((prop) => {
          if (t.isObjectProperty(prop) && t.isStringLiteral(prop.value)) {
            const key = matchText(prop.value.value, locale)
            if (key) {
              matches.push({
                original: prop.value.value,
                key,
                type: 'object-property'
              })
              prop.value = t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(key)]
              )
              needsTImport = true
            }
          }
        })
      },

      // 检查是否已有t函数导入
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        if (path.node.source.value === 'react-i18next' || path.node.source.value === 'i18next') {
          path.node.specifiers.forEach((specifier) => {
            if (t.isImportSpecifier(specifier) && 
                t.isIdentifier(specifier.imported) && 
                specifier.imported.name === 'useTranslation') {
              hasTImport = true
            }
          })
        }
      }
    })

    // 添加必要的导入
    if (needsTImport && !hasTImport) {
      const importDeclaration = t.importDeclaration(
        [t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))],
        t.stringLiteral('react-i18next')
      )
      ast.program.body.unshift(importDeclaration)

      // 在第一个函数组件中添加useTranslation hook
      traverse(ast, {
        FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
          if (path.node.id && 
              t.isIdentifier(path.node.id) && 
              path.node.id.name && 
              path.node.id.name[0] === path.node.id.name[0].toUpperCase()) {
            // 这是一个React组件
            const useTranslationCall = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)
                ]),
                t.callExpression(t.identifier('useTranslation'), [])
              )
            ])
            path.node.body.body.unshift(useTranslationCall)
            return false // 只处理第一个组件
          }
        }
      })
    }

    // 生成代码
    const result = generate(ast, {
      retainLines: true,
      compact: false,
      jsescOption: {
        quotes: 'single'
      }
    })

    return {
      code: result.code,
      matches,
      errors
    }

  } catch (error) {
    errors.push(
      createError(ErrorCode.TRANSFORM_ERROR, 
        `Failed to transform React JSX: ${error instanceof Error ? error.message : String(error)}`)
    )

    return {
      code: source,
      matches: [],
      errors
    }
  }
} 
