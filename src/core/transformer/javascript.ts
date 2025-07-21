import { BaseTransformer } from './base'
import { RecastParser } from '../parsers/recast-parser'
import { VanillaI18nextProvider } from '../providers/vanilla-js'
import type { TransformOptions } from '../../types'
import { createError, ErrorCode } from '../errors'

/**
 * 原生JavaScript转换器
 * 支持原生JS项目的i18n转换
 */
export class JavaScriptTransformer extends BaseTransformer {
  private parser: RecastParser
  private ast: any

  constructor(sourceCode: string, options: TransformOptions) {
    super(sourceCode, options)
    
    // 如果没有提供provider，使用默认的VanillaI18nextProvider
    if (!this.context.provider) {
      this.context.provider = VanillaI18nextProvider
    }
    
    // 初始化recast解析器
    this.parser = new RecastParser()
  }

  protected parse(): any {
    try {
      this.ast = this.parser.parse(this.context.sourceCode)
      return this.ast
    } catch (error) {
      throw createError(
        ErrorCode.PARSE_ERROR,
        'Failed to parse JavaScript code',
        { originalError: error as Error }
      )
    }
  }

  protected async transformAST(ast: any): Promise<any> {
    if (!ast || !this.context.provider) return ast

    // 使用RecastParser进行转换
    this.parser.transformStringLiterals(ast, {
      isMatchedStr: (text: string) => this.isMatchedStr(text),
      addMatch: (original: string, key: string, type: string) => this.addMatch(original, key, type),
      provider: this.context.provider
    })

    return ast
  }

  protected generate(ast: any): string {
    return this.parser.generate(ast)
  }
} 
