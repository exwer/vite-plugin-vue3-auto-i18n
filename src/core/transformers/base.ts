import type { TransformOptions, TransformResult, TextMatch } from '../../types'
import { createError, ErrorCode } from '../errors'
import { TextMatcher } from '../matcher'
import { I18nProvider } from '../providers/base'

export interface TransformerContext {
  sourceCode: string
  options: TransformOptions
  matches: TextMatch[]
  errors: Error[]
  matcher: TextMatcher
  provider?: I18nProvider
}

export abstract class BaseTransformer {
  protected context: TransformerContext

  constructor(sourceCode: string, options: TransformOptions) {
    this.context = {
      sourceCode,
      options,
      matches: [],
      errors: [],
      matcher: new TextMatcher(options.locale),
      provider: options.provider
    }
  }

  /**
   * 主转换方法
   */
  async transform(): Promise<TransformResult> {
    try {
      this.validateInput()
      const ast = this.parse()
      const transformedAst = await this.transformAST(ast)
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
  public addMatch(original: string, key: string, type: string, line?: number, column?: number): void {
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
  public isMatchedStr(text: string): string | false {
    return this.context.matcher.match(text)
  }
} 
