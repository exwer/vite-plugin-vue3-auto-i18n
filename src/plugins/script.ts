import * as recast from 'recast'
import { TransformFormat, DEFAULT_TRANSFORM_FORMAT } from '../core/transform'
import { formatKey } from '../utils'

export interface ScriptTransformOptions {
  isMatchedStr: (text: string) => string | false
  autoImportComputed?: boolean
  transformFormat?: TransformFormat
}

/**
 * 使用 recast 转换 script 代码，保留格式和注释
 */
export async function transformScript(
  sourceCode: string,
  isMatchedStr: (text: string) => string | false,
  transformFormat?: TransformFormat
): Promise<string> {
  // 使用默认格式或用户提供的格式
  const format = transformFormat || DEFAULT_TRANSFORM_FORMAT

  // 检查是否使用自定义格式
  // 通过引用比较判断是否是默认格式
  const isCustomFormat = transformFormat !== undefined && transformFormat !== DEFAULT_TRANSFORM_FORMAT

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
    const transformedAst = transformAST(ast, isMatchedStr, format, isCustomFormat)

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
  format: TransformFormat,
  isCustomFormat: boolean
): any {
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
          // 其他情况：使用自定义脚本格式
          const scriptFormat = formatKey(matched, format.script)
          
          // 对于复杂的自定义格式，我们需要解析并创建对应的 AST
          try {
            // 尝试解析自定义格式
            const parsedFormat = recast.parse(scriptFormat, {
              parser: require('recast/parsers/babel')
            })
            
            // 如果解析成功，直接替换
            if (parsedFormat.program.body.length > 0) {
              const expression = parsedFormat.program.body[0]
              if (expression.type === 'ExpressionStatement') {
                path.replace(expression.expression)
              } else {
                path.replace(expression)
              }
            } else {
              // 解析失败，回退到默认的 $t 调用
              const callExpression = recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
              )
              path.replace(callExpression)
            }
          } catch (error) {
            // 解析失败，回退到默认的 $t 调用
            const callExpression = recast.types.builders.callExpression(
              recast.types.builders.identifier('$t'),
              [recast.types.builders.stringLiteral(matched)]
            )
            path.replace(callExpression)
          }
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
          
          if (isCustomFormat) {
            // 使用自定义脚本格式
            const scriptFormat = formatKey(matched, format.script)
            
            try {
              // 尝试解析自定义格式
              const parsedFormat = recast.parse(scriptFormat, {
                parser: require('recast/parsers/babel')
              })
              
              // 如果解析成功，直接替换
              if (parsedFormat.program.body.length > 0) {
                const expression = parsedFormat.program.body[0]
                if (expression.type === 'ExpressionStatement') {
                  path.replace(expression.expression)
                } else {
                  path.replace(expression)
                }
              } else {
                // 解析失败，回退到默认的 $t 调用
                const templateLiteral = recast.types.builders.templateLiteral(
                  [recast.types.builders.templateElement({ raw: '', cooked: '' }, false)],
                  [recast.types.builders.callExpression(
                    recast.types.builders.identifier('$t'),
                    [recast.types.builders.stringLiteral(matched)]
                  )]
                )
                path.replace(templateLiteral)
              }
            } catch (error) {
              // 解析失败，回退到默认的 $t 调用
              const templateLiteral = recast.types.builders.templateLiteral(
                [recast.types.builders.templateElement({ raw: '', cooked: '' }, false)],
                [recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
                )]
              )
              path.replace(templateLiteral)
            }
          } else {
            // 使用默认格式，创建模板字符串 `${$t('key')}`
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
              
              // 使用传入的自定义格式标志
              
              if (isCustomFormat) {
                // 使用自定义脚本格式，不包装 computed
                const scriptFormat = formatKey(matched, format.script)
                
                try {
                  // 尝试解析自定义格式
                  const parsedFormat = recast.parse(scriptFormat, {
                    parser: require('recast/parsers/babel')
                  })
                  
                  // 如果解析成功，直接替换
                  if (parsedFormat.program.body.length > 0) {
                    const expression = parsedFormat.program.body[0]
                    if (expression.type === 'ExpressionStatement') {
                      return expression.expression
                    } else {
                      return expression
                    }
                  } else {
                    // 解析失败，回退到默认的 $t 调用
                    return recast.types.builders.callExpression(
                      recast.types.builders.identifier('$t'),
                      [recast.types.builders.stringLiteral(matched)]
                    )
                  }
                } catch (error) {
                  // 解析失败，回退到默认的 $t 调用
                  return recast.types.builders.callExpression(
                    recast.types.builders.identifier('$t'),
                    [recast.types.builders.stringLiteral(matched)]
                  )
                }
              } else {
                // 使用默认格式，直接使用 $t 调用
              return recast.types.builders.callExpression(
                recast.types.builders.identifier('$t'),
                [recast.types.builders.stringLiteral(matched)]
              )
              }
            }
          }
          return element
        })

        // 检查父节点是否是对象属性
        const isInObjectProperty = path.parent && path.parent.node.type === 'ObjectProperty'
        
        // 只有在使用默认格式时才包装 computed，且不在对象属性内部
        if (!isCustomFormat && !isInObjectProperty && replaced.some((el: any) => el.type === 'CallExpression' && el.callee.name === '$t')) {
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
        } else if (isCustomFormat) {
          // 对于自定义格式，直接替换数组元素
          path.node.elements = replaced
        } else if (isInObjectProperty) {
          // 在对象属性内部的数组，直接替换元素
          path.node.elements = replaced
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
              
              // 使用传入的自定义格式标志
              
              if (isCustomFormat) {
                // 使用自定义脚本格式，不包装 computed
                const scriptFormat = formatKey(matched, format.script)
                
                try {
                  // 尝试解析自定义格式
                  const parsedFormat = recast.parse(scriptFormat, {
                    parser: require('recast/parsers/babel')
                  })
                  
                  // 如果解析成功，直接替换
                  if (parsedFormat.program.body.length > 0) {
                    const expression = parsedFormat.program.body[0]
                    if (expression.type === 'ExpressionStatement') {
                      return recast.types.builders.objectProperty(
                        property.key,
                        expression.expression
                      )
                    } else {
                      return recast.types.builders.objectProperty(
                        property.key,
                        expression
                      )
                    }
                  } else {
                    // 解析失败，回退到默认的 $t 调用
                    return recast.types.builders.objectProperty(
                      property.key,
                      recast.types.builders.callExpression(
                        recast.types.builders.identifier('$t'),
                        [recast.types.builders.stringLiteral(matched)]
                      )
                    )
                  }
                } catch (error) {
                  // 解析失败，回退到默认的 $t 调用
                  return recast.types.builders.objectProperty(
                    property.key,
                    recast.types.builders.callExpression(
                      recast.types.builders.identifier('$t'),
                      [recast.types.builders.stringLiteral(matched)]
                    )
                  )
                }
              } else {
                // 使用默认格式，直接使用 $t 调用（会在外层包装 computed）
              return recast.types.builders.objectProperty(
                property.key,
                recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
                )
              )
              }
            }
          }
          return property
        })

        // 只有在使用默认格式时才包装 computed
        
        if (!isCustomFormat && replaced.some((prop: any) => 
          prop.type === 'ObjectProperty' && 
          prop.value.type === 'CallExpression'
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
        } else if (isCustomFormat) {
          // 对于自定义格式，不包装 computed
        } else {
          // 对于混合类型对象，不包装 computed
        }
      } else {
        // 处理混合类型的对象：只替换字符串属性，不包装整个对象
        path.node.properties.forEach((property: any) => {
          if (property.type === 'ObjectProperty' && property.value.type === 'StringLiteral') {
            const matched = isMatchedStr(property.value.value)
            if (matched) {
              hasMatchedStrings = true
              
              // 使用自定义脚本格式
              const scriptFormat = formatKey(matched, format.script)
              
              try {
                // 尝试解析自定义格式
                const parsedFormat = recast.parse(scriptFormat, {
                  parser: require('recast/parsers/babel')
                })
                
                // 如果解析成功，直接替换
                if (parsedFormat.program.body.length > 0) {
                  const expression = parsedFormat.program.body[0]
                  if (expression.type === 'ExpressionStatement') {
                    property.value = expression.expression
                  } else {
                    property.value = expression
                  }
                } else {
                  // 解析失败，回退到默认的 $t 调用
                  property.value = recast.types.builders.callExpression(
                    recast.types.builders.identifier('$t'),
                    [recast.types.builders.stringLiteral(matched)]
                  )
                }
              } catch (error) {
                // 解析失败，回退到默认的 $t 调用
                property.value = recast.types.builders.callExpression(
                  recast.types.builders.identifier('$t'),
                  [recast.types.builders.stringLiteral(matched)]
                )
              }
            }
          }
          // 处理数组属性
          else if (property.type === 'ObjectProperty' && property.value.type === 'ArrayExpression') {
            // 手动处理数组
            const arrayElements = property.value.elements
            const allStringLiterals = arrayElements.every(
              (element: any) => element && element.type === 'StringLiteral'
            )
            
            if (allStringLiterals) {
              const replaced = arrayElements.map((element: any) => {
                if (element && element.type === 'StringLiteral') {
                  const matched = isMatchedStr(element.value)
                  if (matched) {
                    hasMatchedStrings = true
                    
                    if (isCustomFormat) {
                      // 使用自定义脚本格式
                      const scriptFormat = formatKey(matched, format.script)
                      
                      try {
                        // 尝试解析自定义格式
                        const parsedFormat = recast.parse(scriptFormat, {
                          parser: require('recast/parsers/babel')
                        })
                        
                        // 如果解析成功，直接替换
                        if (parsedFormat.program.body.length > 0) {
                          const expression = parsedFormat.program.body[0]
                          if (expression.type === 'ExpressionStatement') {
                            return expression.expression
                          } else {
                            return expression
                          }
                        } else {
                          // 解析失败，回退到默认的 $t 调用
                          return recast.types.builders.callExpression(
                            recast.types.builders.identifier('$t'),
                            [recast.types.builders.stringLiteral(matched)]
                          )
                        }
                      } catch (error) {
                        // 解析失败，回退到默认的 $t 调用
                        return recast.types.builders.callExpression(
                          recast.types.builders.identifier('$t'),
                          [recast.types.builders.stringLiteral(matched)]
                        )
                      }
                    } else {
                      // 使用默认格式，直接使用 $t 调用
                      return recast.types.builders.callExpression(
                        recast.types.builders.identifier('$t'),
                        [recast.types.builders.stringLiteral(matched)]
                      )
                    }
                  }
                }
                return element
              })
              
              // 直接替换数组元素
              property.value.elements = replaced
            }
          }
          // 处理嵌套对象属性
          else if (property.type === 'ObjectProperty' && property.value.type === 'ObjectExpression') {
            // 手动处理嵌套对象
            const nestedProperties = property.value.properties
            nestedProperties.forEach((nestedProperty: any) => {
              if (nestedProperty.type === 'ObjectProperty' && nestedProperty.value.type === 'StringLiteral') {
                const matched = isMatchedStr(nestedProperty.value.value)
                if (matched) {
                  hasMatchedStrings = true
                  
                  if (isCustomFormat) {
                    // 使用自定义脚本格式
                    const scriptFormat = formatKey(matched, format.script)
                    
                    try {
                      // 尝试解析自定义格式
                      const parsedFormat = recast.parse(scriptFormat, {
                        parser: require('recast/parsers/babel')
                      })
                      
                      // 如果解析成功，直接替换
                      if (parsedFormat.program.body.length > 0) {
                        const expression = parsedFormat.program.body[0]
                        if (expression.type === 'ExpressionStatement') {
                          nestedProperty.value = expression.expression
                        } else {
                          nestedProperty.value = expression
                        }
                      } else {
                        // 解析失败，回退到默认的 $t 调用
                        nestedProperty.value = recast.types.builders.callExpression(
                          recast.types.builders.identifier('$t'),
                          [recast.types.builders.stringLiteral(matched)]
                        )
                      }
                    } catch (error) {
                      // 解析失败，回退到默认的 $t 调用
                      nestedProperty.value = recast.types.builders.callExpression(
                        recast.types.builders.identifier('$t'),
                        [recast.types.builders.stringLiteral(matched)]
                      )
                    }
                  } else {
                    // 使用默认格式，直接使用 $t 调用
                    nestedProperty.value = recast.types.builders.callExpression(
                      recast.types.builders.identifier('$t'),
                      [recast.types.builders.stringLiteral(matched)]
                    )
                  }
                }
              }
              // 处理更深层的嵌套对象
              else if (nestedProperty.type === 'ObjectProperty' && nestedProperty.value.type === 'ObjectExpression') {
                // 递归处理更深层的嵌套对象
                const deeperProperties = nestedProperty.value.properties
                deeperProperties.forEach((deeperProperty: any) => {
                  if (deeperProperty.type === 'ObjectProperty' && deeperProperty.value.type === 'StringLiteral') {
                    const matched = isMatchedStr(deeperProperty.value.value)
                    if (matched) {
                      hasMatchedStrings = true
                      
                      if (isCustomFormat) {
                        // 使用自定义脚本格式
                        const scriptFormat = formatKey(matched, format.script)
                        
                        try {
                          // 尝试解析自定义格式
                          const parsedFormat = recast.parse(scriptFormat, {
                            parser: require('recast/parsers/babel')
                          })
                          
                          // 如果解析成功，直接替换
                          if (parsedFormat.program.body.length > 0) {
                            const expression = parsedFormat.program.body[0]
                            if (expression.type === 'ExpressionStatement') {
                              deeperProperty.value = expression.expression
                            } else {
                              deeperProperty.value = expression
                            }
                          } else {
                            // 解析失败，回退到默认的 $t 调用
                            deeperProperty.value = recast.types.builders.callExpression(
                              recast.types.builders.identifier('$t'),
                              [recast.types.builders.stringLiteral(matched)]
                            )
                          }
                        } catch (error) {
                          // 解析失败，回退到默认的 $t 调用
                          deeperProperty.value = recast.types.builders.callExpression(
                            recast.types.builders.identifier('$t'),
                            [recast.types.builders.stringLiteral(matched)]
                          )
                        }
                      } else {
                        // 使用默认格式，直接使用 $t 调用
                        deeperProperty.value = recast.types.builders.callExpression(
                          recast.types.builders.identifier('$t'),
                          [recast.types.builders.stringLiteral(matched)]
                        )
                      }
                    }
                  }
                })
              }
            })
          }
        })
      }
      
      return false
    }
  })

  // 如果有匹配的字符串但没有 computed 导入，自动添加
  if (hasMatchedStrings && !hasComputedImport) {
    // 检查是否需要 computed 或 reactive
    const needsComputed = format.script.toString().includes('computed')
    const needsReactive = format.script.toString().includes('reactive')
    
    if (needsComputed || needsReactive) {
      if (hasVueImport && vueImportPath) {
        // 在现有的 vue 导入中添加需要的导入
        if (needsComputed) {
          const computedSpecifier = recast.types.builders.importSpecifier(
            recast.types.builders.identifier('computed'),
            recast.types.builders.identifier('computed')
          )
          vueImportPath.node.specifiers.push(computedSpecifier)
        }
        if (needsReactive) {
          const reactiveSpecifier = recast.types.builders.importSpecifier(
            recast.types.builders.identifier('reactive'),
            recast.types.builders.identifier('reactive')
          )
          vueImportPath.node.specifiers.push(reactiveSpecifier)
        }
      } else {
        // 创建新的 vue 导入
        const specifiers = []
        if (needsComputed) {
          specifiers.push(
        recast.types.builders.importSpecifier(
          recast.types.builders.identifier('computed'),
          recast.types.builders.identifier('computed')
        )
      )
        }
        if (needsReactive) {
          specifiers.push(
            recast.types.builders.importSpecifier(
              recast.types.builders.identifier('reactive'),
              recast.types.builders.identifier('reactive')
            )
          )
        }
        
      const importDeclaration = recast.types.builders.importDeclaration(
          specifiers,
          recast.types.builders.stringLiteral('vue')
        )
        ast.program.body.unshift(importDeclaration)
      }
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
