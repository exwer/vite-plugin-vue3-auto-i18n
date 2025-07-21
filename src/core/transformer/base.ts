import type { TransformOptions, TransformResult, TextMatch } from '../../types'
import { createError, ErrorCode } from '../../utils/errors'

export interface TransformerContext {
  sourceCode: string
  options: TransformOptions
  matches: TextMatch[]
  errors: Error[]
}

export abstract class BaseTransformer {
  protected context: TransformerContext

  constructor(sourceCode: string, options: TransformOptions) {
    this.context = {
      sourceCode,
      options,
      matches: [],
      errors: []
    }
  }

  /**
   * 主转换方法
   */
  async transform(): Promise<TransformResult> {
    try {
      this.validateInput()
      const ast = this.parse()
      const transformedAst = this.transformAST(ast)
      const result = this.generate(transformedAst)
      
      return {
        code: result,
        matches: this.context.matches,
        errors: this.context.errors
      }
    } catch (error) {
      this.handleError(error)
      return {
        code: this.context.sourceCode, // 返回原始代码作为fallback
        matches: this.context.matches,
        errors: this.context.errors
      }
    }
  }

  /**
   * 验证输入
   */
  protected validateInput(): void {
    const { locale } = this.context.options
    
    if (!locale) {
      throw createError(
        ErrorCode.MISSING_LOCALE,
        'config.locale is required',
        { received: locale }
      )
    }
    
    if (typeof locale !== 'object' || Array.isArray(locale)) {
      throw createError(
        ErrorCode.INVALID_LOCALE,
        'config.locale must be an object with language keys',
        { received: locale, type: typeof locale }
      )
    }
  }

  /**
   * 解析源代码为AST
   */
  protected abstract parse(): any

  /**
   * 转换AST
   */
  protected abstract transformAST(ast: any): any

  /**
   * 生成最终代码
   */
  protected abstract generate(ast: any): string

  /**
   * 错误处理
   */
  protected handleError(error: any): void {
    if (error instanceof Error) {
      this.context.errors.push(error)
    } else {
      this.context.errors.push(new Error(String(error)))
    }
  }

  /**
   * 添加匹配结果
   */
  protected addMatch(original: string, key: string, type: string, line?: number, column?: number): void {
    this.context.matches.push({
      original,
      key,
      type,
      line,
      column
    })
  }

  /**
   * 检查文本是否匹配
   */
  protected isMatchedStr(text: string): string | false {
    const { locale, customMatcher, keyGenerator } = this.context.options
    
    if (customMatcher) {
      const res = customMatcher(text)
      if (res) return res
    }
    
    // 使用缓存匹配器
    const matched = this.getCachedMatch(text)
    if (matched) return matched
    
    if (keyGenerator) return keyGenerator(text)
    return false
  }

  /**
   * 缓存匹配结果
   */
  private matchCache = new Map<string, string | false>()

  private getCachedMatch(text: string): string | false {
    if (this.matchCache.has(text)) {
      return this.matchCache.get(text) || false
    }
    
    const result = this.searchInLocale(text)
    this.matchCache.set(text, result || false)
    return result
  }

  /**
   * 在locale中搜索文本
   */
  private searchInLocale(text: string): string | false {
    const { locale } = this.context.options
    const languages = Object.keys(locale)
    
    for (const lang of languages) {
      const langData = locale[lang]
      if (!langData) continue
      
      const result = this.searchInObject(langData, text)
      if (result) {
        return result
      }
    }
    return false
  }

  /**
   * 递归搜索对象
   */
  private searchInObject(obj: any, value: string, currentPath: string = ''): string | false {
    for (const [key, val] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key
      
      if (val === value) {
        return newPath
      }
      else if (typeof val === 'object' && val !== null) {
        const result = this.searchInObject(val, value, newPath)
        if (result) {
          return result
        }
      }
    }
    return false
  }
} 
