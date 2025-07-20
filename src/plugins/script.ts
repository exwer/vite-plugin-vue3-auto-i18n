import * as recast from 'recast'

export interface ScriptTransformOptions {
  isMatchedStr: (text: string) => string | false
  autoImportComputed?: boolean
}

/**
 * 使用 recast 转换 script 代码，保留格式和注释
 */
export async function transformScript(
  sourceCode: string,
  isMatchedStr: (text: string) => string | false,
  options: Partial<ScriptTransformOptions> = {}
): Promise<string> {
  const { autoImportComputed = true } = options

  // 处理空代码
  if (!sourceCode.trim()) {
    return sourceCode
  }

  try {
    // 解析代码为 AST
    const ast = recast.parse(sourceCode, {
      parser: require('recast/parsers/babel')
    })

    // 转换 AST
    const transformedAst = transformAST(ast, isMatchedStr, { autoImportComputed })

    // 重新生成代码，保留格式
    const result = recast.print(transformedAst, {
      quote: 'single',
      tabWidth: 2,
      useTabs: false,
      lineTerminator: '\n' // 统一使用 Unix 换行符
    })

    return result.code
  } catch (error) {
    // 如果解析失败，抛出错误
    throw error
  }
}

/**
 * 转换 AST - 优化版本，合并遍历
 */
function transformAST(
  ast: any,
  isMatchedStr: (text: string) => string | false,
  options: { autoImportComputed: boolean }
): any {
  const { autoImportComputed } = options
  let hasComputedImport = false
  let hasVueImport = false
  let vueImportPath: any = null
  let hasMatchedStrings = false // 标记是否有匹配的字符串

  // 合并遍历：同时检查import和转换字符串
  recast.visit(ast, {
    visitImportDeclaration(path: any) {
      const source = path.node.source.value
      if (source === 'vue') {
        hasVueImport = true
        vueImportPath = path
        path.node.specifiers.forEach((specifier: any) => {
          if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'computed') {
            hasComputedImport = true
          }
        })
      }
      return false
    },

    visitStringLiteral(path: any) {
      // 跳过 import ... from 'xxx'
      if (path.parent.node.type === 'ImportDeclaration') {
        return false
      }

      const value = path.node.value
      const matched = isMatchedStr(value)
      
      if (matched) {
        hasMatchedStrings = true
        
        // 检查是否在 ref() 调用中
        if (
          path.parent.node.type === 'CallExpression' &&
          path.parent.node.callee.type === 'Identifier' &&
          path.parent.node.callee.name === 'ref'
        ) {
          // ref('xxx') -> ref($t('key'))
          const callExpression = recast.types.builders.callExpression(
            recast.types.builders.identifier('$t'),
            [recast.types.builders.stringLiteral(matched)]
          )
          path.replace(callExpression)
        } else {
          // 其他情况：用 computed 包装
          const computedCall = recast.types.builders.callExpression(
            recast.types.builders.identifier('computed'),
            [
              recast.types.builders.arrowFunctionExpression(
                [],
                recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
                )
              )
            ]
          )
          path.replace(computedCall)
        }
      }
      
      return false
    },

    visitTemplateLiteral(path: any) {
      // 处理模板字符串
      if (path.node.quasis.length === 1 && path.node.expressions.length === 0) {
        // 简单模板字符串，如 `hello world`
        const value = path.node.quasis[0].value.raw
        const matched = isMatchedStr(value)
        
        if (matched) {
          hasMatchedStrings = true
          // 创建模板字符串 `${$t('key')}`
          const templateLiteral = recast.types.builders.templateLiteral(
            [recast.types.builders.templateElement({ raw: '', cooked: '' }, false)],
            [recast.types.builders.callExpression(
              recast.types.builders.identifier('$t'),
              [recast.types.builders.stringLiteral(matched)]
            )]
          )
          
          path.replace(templateLiteral)
        }
      }
      
      return false
    },

    visitArrayExpression(path: any) {
      // 检查是否所有元素都是字符串字面量
      const allStringLiterals = path.node.elements.every(
        (element: any) => element && element.type === 'StringLiteral'
      )

      if (allStringLiterals) {
        const replaced = path.node.elements.map((element: any) => {
          if (element && element.type === 'StringLiteral') {
            const matched = isMatchedStr(element.value)
            if (matched) {
              hasMatchedStrings = true
              return recast.types.builders.callExpression(
                recast.types.builders.identifier('$t'),
                [recast.types.builders.stringLiteral(matched)]
              )
            }
          }
          return element
        })

        // 如果有任何字符串被替换，用 computed 包装整个数组
        if (replaced.some((el: any) => el.type === 'CallExpression' && el.callee.name === '$t')) {
          const computedCall = recast.types.builders.callExpression(
            recast.types.builders.identifier('computed'),
            [
              recast.types.builders.arrowFunctionExpression(
                [],
                recast.types.builders.arrayExpression(replaced)
              )
            ]
          )
          path.replace(computedCall)
        }
      }
      
      return false
    },

    visitObjectExpression(path: any) {
      // 检查是否所有属性值都是字符串字面量
      const allStringProperties = path.node.properties.every(
        (property: any) => property.type === 'ObjectProperty' && property.value.type === 'StringLiteral'
      )

      if (allStringProperties) {
        const replaced = path.node.properties.map((property: any) => {
          if (property.type === 'ObjectProperty' && property.value.type === 'StringLiteral') {
            const matched = isMatchedStr(property.value.value)
            if (matched) {
              hasMatchedStrings = true
              return recast.types.builders.objectProperty(
                property.key,
                recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
                )
              )
            }
          }
          return property
        })

        // 如果有任何字符串被替换，用 computed 包装整个对象
        if (replaced.some((prop: any) => 
          prop.type === 'ObjectProperty' && 
          prop.value.type === 'CallExpression' && 
          prop.value.callee.name === '$t'
        )) {
          const computedCall = recast.types.builders.callExpression(
            recast.types.builders.identifier('computed'),
            [
              recast.types.builders.arrowFunctionExpression(
                [],
                recast.types.builders.objectExpression(replaced)
              )
            ]
          )
          path.replace(computedCall)
        }
      }
      
      return false
    }
  })

  // 只有在有匹配字符串且需要自动导入 computed 且还没有导入时才添加
  if (hasMatchedStrings && autoImportComputed && !hasComputedImport) {
    if (hasVueImport) {
      // 在现有的 vue import 中添加 computed
      vueImportPath.node.specifiers.push(
        recast.types.builders.importSpecifier(
          recast.types.builders.identifier('computed'),
          recast.types.builders.identifier('computed')
        )
      )
    } else {
      // 创建新的 vue import
      const importDeclaration = recast.types.builders.importDeclaration(
        [recast.types.builders.importSpecifier(
          recast.types.builders.identifier('computed'),
          recast.types.builders.identifier('computed')
        )],
        recast.types.builders.stringLiteral('vue')
      )
      ast.program.body.unshift(importDeclaration)
    }
  }

  return ast
}

// 为了保持向后兼容，保留原来的 babel 插件接口
export default function(
  babel: any,
  { isMatchedStr }: { isMatchedStr: (target: string) => false | string },
): any {
  return {
    visitor: {
      Program(path: any) {
        // 这里不再使用 babel 转换，而是抛出错误提示使用新的 API
        throw new Error('Please use transformScript() function instead of babel plugin')
      },
    },
  }
}
