import recast from 'recast'
import type { I18nProvider } from '../providers/base'

/**
 * 异步加载 parser，优先使用 recast typescript parser，fallback 到 babel parser
 */
async function loadParser(): Promise<any> {
  // 尝试加载 recast typescript parser
  try {
    const typescriptParser = await import('recast/parsers/typescript')
    return typescriptParser.default || typescriptParser
  } catch (error) {
            console.warn('[i18ncraft:RecastParser] Failed to load recast typescript parser, falling back to babel parser')
    
    // 尝试加载 babel parser 作为 fallback
    try {
      const { parse } = await import('@babel/parser')
      return {
        parse: (source: string) => parse(source, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx']
        })
      }
    } catch (babelError) {
              console.error('[i18ncraft:RecastParser] Failed to load any parser:', error, babelError)
      throw new Error('No suitable parser available')
    }
  }
}

export interface RecastParseOptions {
  parser?: any
}

export interface RecastTransformOptions {
  isMatchedStr: (text: string) => string | false
  addMatch: (original: string, key: string, type: string) => void
  provider: I18nProvider
  scope?: string
}

/**
 * 通用的recast AST解析器
 * 提供统一的JavaScript AST解析和转换能力
 */
export class RecastParser {
  private options: RecastParseOptions

  private parserPromise: Promise<any>

  constructor(options: RecastParseOptions = {}) {
    // 异步加载 parser
    this.parserPromise = options.parser 
      ? Promise.resolve(options.parser)
      : loadParser()
    
    this.options = {
      parser: null, // 将在首次使用时异步设置
      ...options
    }
  }

  /**
   * 解析JavaScript代码为AST
   */
  async parse(sourceCode: string): Promise<any> {
    // 确保 parser 已加载
    if (!this.options.parser) {
      this.options.parser = await this.parserPromise
    }
    
    if (!this.options.parser || !this.options.parser.parse) {
      console.error('[i18ncraft:RecastParser] Parser is undefined or invalid:', this.options.parser)
      throw new Error('Parser is not properly initialized')
    }
    
    return recast.parse(sourceCode, {
      parser: this.options.parser
    })
  }

  /**
   * 将AST转换回代码
   */
  generate(ast: any): string {
    return recast.print(ast).code
  }

  /**
   * 遍历并转换AST中的字符串字面量，并在顶层包装computed
   */
  transformStringLiterals(ast: any, options: RecastTransformOptions): void {
    const { isMatchedStr, addMatch, provider, scope } = options
    let needsImport = false
    const variableDeclaratorsToWrap: any[] = []

    // 第一遍：标记包含i18n字符串的变量声明
    recast.visit(ast, {
      visitVariableDeclarator: (path) => {
        if (path.node.init) {
          let hasI18nStrings = false
          
          // 检查这个变量初始化值是否包含i18n字符串
          recast.visit(path.node.init, {
            visitLiteral: (literalPath) => {
              if (typeof literalPath.node.value === 'string') {
                const key = isMatchedStr(literalPath.node.value)
                if (key) {
                  hasI18nStrings = true
                }
              }
              return false
            }
          })
          
          if (hasI18nStrings) {
            variableDeclaratorsToWrap.push(path)
          }
        }
                // 继续遍历子节点
        return false
      }
    })

    // 第二遍：转换字符串字面量
    recast.visit(ast, {
      visitLiteral: (path) => {
        if (typeof path.node.value === 'string') {
          const key = isMatchedStr(path.node.value)
          if (key) {
            addMatch(path.node.value, key, 'string-literal')
            
            // 使用Provider创建AST节点，优先使用scoped版本
            const translationAst = provider.createScopedTranslationAst 
              ? provider.createScopedTranslationAst(key, scope)
              : provider.createTranslationAst(key)
            path.replace(translationAst as any)
            needsImport = true
          }
        }
        return false
      }
    })

    // 第三遍：包装变量声明
    variableDeclaratorsToWrap.forEach(declaratorPath => {
      const declarator = declaratorPath.node
      if (declarator.init) {
        // 检查是否是ref或reactive调用
        if (declarator.init.type === 'CallExpression') {
          const callee = declarator.init.callee
          if (callee.type === 'Identifier' && (callee.name === 'ref' || callee.name === 'reactive')) {
            // 替换ref/reactive为computed
            declarator.init = {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'computed' },
              arguments: [
                {
                  type: 'ArrowFunctionExpression',
                  params: [],
                  body: declarator.init.arguments[0]
                }
              ]
            }
            return
          }
        }

        // 普通变量声明包装computed
        declarator.init = {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'computed' },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              params: [],
              body: declarator.init
            }
          ]
        }
      }
    })

    // 如果需要，添加import声明
    if (needsImport && provider.getImportDeclarations) {
      const imports = provider.getImportDeclarations()
      imports.forEach(importDecl => {
        ast.program.body.unshift(importDecl as any)
      })
    }

    // 如果需要，添加hook声明
    if (needsImport && provider.getHookDeclarations) {
      const hooks = provider.getHookDeclarations()
      let insertIndex = 0
      
      // 找到import语句后的位置
      for (let i = 0; i < ast.program.body.length; i++) {
        if (ast.program.body[i].type !== 'ImportDeclaration') {
          insertIndex = i
          break
        }
      }
      
      hooks.forEach((hookDecl, index) => {
        ast.program.body.splice(insertIndex + index, 0, hookDecl as any)
      })
    }
  }

  /**
   * 完整的解析和转换流程
   */
  async transform(sourceCode: string, options: RecastTransformOptions): Promise<string> {
    try {
      const ast = await this.parse(sourceCode)
      this.transformStringLiterals(ast, options)
      return this.generate(ast)
    } catch (error) {
      console.error('[i18ncraft:RecastParser] Transform error:', error)
      return sourceCode // 返回原始代码作为fallback
    }
  }
} 
 