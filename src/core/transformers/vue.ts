import { parse } from '@vue/compiler-sfc'
import { BaseTransformer } from './base'
import { VueI18nProvider } from '../providers/vue-i18n'
import { RecastParser } from '../parsers/recast-parser'
import { EnhancedVueTemplateASTTransformer } from './vue-template-ast'
import type { TransformOptions, TransformResult } from '../../types'
import { createError, ErrorCode } from '../errors'
import MagicString from 'magic-string'

export class VueTransformer extends BaseTransformer {
  private descriptor: any
  private recastParser: RecastParser

  constructor(sourceCode: string, options: TransformOptions) {
    super(sourceCode, options)
    // 如果没有提供provider，使用默认的VueI18nProvider
    if (!this.context.provider) {
      this.context.provider = VueI18nProvider
    }
    // 初始化recast解析器
    this.recastParser = new RecastParser()
  }

  protected parse(): any {
    try {
      const { descriptor, errors } = parse(this.context.sourceCode, { filename: 'anonymous.vue' })
      if (errors.length) {
        errors.forEach(error => this.handleError(error))
      }
      this.descriptor = descriptor
      return descriptor
    } catch (error) {
      throw createError(
        ErrorCode.PARSE_ERROR,
        'Failed to parse Vue SFC',
        { originalError: error as Error }
      )
    }
  }

  protected async transformAST(descriptor: any): Promise<any> {
    const s = new MagicString(this.context.sourceCode)

    // 1. 转换 Script 部分
    if (descriptor.script || descriptor.scriptSetup) {
      const scriptBlock = descriptor.scriptSetup || descriptor.script
      const transformedScript = await this.transformScriptBlock(scriptBlock.content)
      s.overwrite(
        scriptBlock.loc.start.offset, 
        scriptBlock.loc.end.offset, 
        `\n${transformedScript}\n`
      )
    }

    // 2. 转换 Template 部分
    if (descriptor.template) {
      const transformedTemplate = await this.transformTemplateBlock(descriptor.template.content)
      s.overwrite(
        descriptor.template.loc.start.offset,
        descriptor.template.loc.end.offset,
        transformedTemplate
      )
    }

    return s
  }

  protected generate(result: any): string {
    return result.toString()
  }

    /**
   * 转换脚本块，使用RecastParser进行AST转换
   */
  private async transformScriptBlock(scriptContent: string): Promise<string> {
    try {
      if (!this.context.provider) return scriptContent

      // 使用RecastParser进行转换，指定为script作用域
      return await this.recastParser.transform(scriptContent, {
        isMatchedStr: (text: string) => this.isMatchedStr(text),
        addMatch: (original: string, key: string, type: string) => this.addMatch(original, key, 'script-literal'),
        provider: this.context.provider,
        scope: 'script'
      })
    } catch (error) {
      this.handleError(error)
      return scriptContent
    }
  }

  /**
   * 转换模板块，使用AST模式进行精确转换
   * 支持：基本文本、静态属性、动态属性、指令、组件props等
   */
  private async transformTemplateBlock(templateContent: string): Promise<string> {
    try {
      // 使用增强的AST转换器
      const astTransformer = new EnhancedVueTemplateASTTransformer({
        isMatchedStr: (text: string) => this.isMatchedStr(text),
        addMatch: (original: string, key: string, type: string) => this.addMatch(original, key, type),
        provider: this.context.provider
      })

      return astTransformer.transform(templateContent)
    } catch (error) {
      this.handleError(error)
      return templateContent // 回退到原始内容
    }
  }

} 
 