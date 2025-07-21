import recast from 'recast'
import type { I18nProvider } from '../providers/base'

export interface RecastParseOptions {
  parser?: any
}

export interface RecastTransformOptions {
  isMatchedStr: (text: string) => string | false
  addMatch: (original: string, key: string, type: string) => void
  provider: I18nProvider
}

/**
 * 通用的recast AST解析器
 * 提供统一的JavaScript AST解析和转换能力
 */
export class RecastParser {
  private options: RecastParseOptions

  constructor(options: RecastParseOptions = {}) {
    this.options = {
      parser: require('recast/parsers/typescript'),
      ...options
    }
  }

  /**
   * 解析JavaScript代码为AST
   */
  parse(sourceCode: string): any {
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
   * 遍历并转换AST中的字符串字面量
   */
  transformStringLiterals(ast: any, options: RecastTransformOptions): void {
    const { isMatchedStr, addMatch, provider } = options
    let needsImport = false

    recast.visit(ast, {
      visitLiteral: (path) => {
        if (typeof path.node.value === 'string') {
          const key = isMatchedStr(path.node.value)
          if (key) {
            addMatch(path.node.value, key, 'string-literal')
            
            // 使用Provider创建AST节点
            const translationAst = provider.createTranslationAst(key)
            path.replace(translationAst as any)
            needsImport = true
          }
        }
        return false
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
      const ast = this.parse(sourceCode)
      this.transformStringLiterals(ast, options)
      return this.generate(ast)
    } catch (error) {
      console.error('[RecastParser] Transform error:', error)
      return sourceCode // 返回原始代码作为fallback
    }
  }
} 
