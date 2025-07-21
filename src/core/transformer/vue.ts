import { parse } from '@vue/compiler-sfc'
import { BaseTransformer } from './base'
import type { TransformOptions, TransformResult } from '../../types'
import { createError, ErrorCode } from '../../utils/errors'
import { formatKey } from '../../utils'

export class VueTransformer extends BaseTransformer {
  private descriptor: any
  private transformFormat: any

  constructor(sourceCode: string, options: TransformOptions) {
    super(sourceCode, options)
    this.transformFormat = options.transformFormat || this.getDefaultFormat()
  }

  protected parse(): any {
    try {
      this.descriptor = parse(this.context.sourceCode)
      return this.descriptor
    } catch (error) {
      throw createError(
        ErrorCode.PARSE_ERROR,
        'Failed to parse Vue SFC',
        { originalError: error }
      )
    }
  }

  protected transformAST(descriptor: any): any {
    let result = this.context.sourceCode

    // 转换模板
    if (this.context.options.enableTemplate !== false && descriptor.template) {
      try {
        const templateResult = this.transformTemplate(descriptor.template)
        if (templateResult) {
          const start = descriptor.template.loc.start.offset
          const end = descriptor.template.loc.end.offset
          result = result.substring(0, start) + templateResult + result.substring(end)
        }
      } catch (error) {
        this.handleError(error)
      }
    }

    // 转换脚本
    if (this.context.options.enableScript !== false) {
      const scriptBlock = descriptor.scriptSetup || descriptor.script
      if (scriptBlock) {
        try {
          const scriptResult = this.transformScript(scriptBlock)
          if (scriptResult) {
            const start = scriptBlock.loc.start.offset
            const end = scriptBlock.loc.end.offset
            result = result.substring(0, start) + scriptResult + result.substring(end)
          }
        } catch (error) {
          this.handleError(error)
        }
      }
    }

    if (this.context.options.debug) {
      console.log('[i18ncraft] transformed SFC')
    }

    return result
  }

  protected generate(result: string): string {
    return result
  }

  private async transformTemplate(template: any): Promise<string | null> {
    const templateTransformer = require('../../plugins/template').default
    return await templateTransformer(
      template.content,
      (text: string) => this.isMatchedStr(text),
      this.transformFormat
    )
  }

  private async transformScript(scriptBlock: any): Promise<string | null> {
    const { transformScript } = require('../../plugins/script')
    return await transformScript(
      scriptBlock.content,
      (text: string) => this.isMatchedStr(text),
      this.transformFormat
    )
  }

  private getDefaultFormat() {
    return {
      template: (key: string) => `$t('${key}')`,
      script: (key: string) => `computed(() => $t('${key}'))`,
      interpolation: (key: string) => `$t('${key}')`
    }
  }
} 
