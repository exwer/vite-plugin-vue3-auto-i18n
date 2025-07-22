import { parse } from '@vue/compiler-sfc'
import { BaseTransformer } from './base'
import { VueI18nProvider } from '../providers/vue-i18n'
import { RecastParser } from '../parsers/recast-parser'
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
   * 转换模板块，使用增强的字符串匹配和替换
   * 支持：基本文本、静态属性、动态属性、指令、组件props等
   */
  private async transformTemplateBlock(templateContent: string): Promise<string> {
    try {
      let result = templateContent

      // 1. 转换Vue指令中的字符串 (v-text="'value'", v-html="'value'") - 优先处理
      result = this.transformDirectiveStrings(result)

      // 2. 转换动态属性 (:attr="'value'" 或 v-bind:attr="'value'")
      result = this.transformDynamicAttributes(result)

      // 3. 转换组件props中的复杂表达式
      result = this.transformComplexExpressions(result)

      // 4. 转换静态属性 (attr="value")
      result = this.transformStaticAttributes(result)

      // 5. 转换基本文本内容 (>text<) - 最后处理，避免影响其他转换
      result = this.transformTextContent(result)

      return result
    } catch (error) {
      this.handleError(error)
      return templateContent
    }
  }

  /**
   * 转换基本文本内容
   */
  private transformTextContent(content: string): string {
    const textRegex = />([^<]+)</g
    let result = content
    let match

    while ((match = textRegex.exec(content)) !== null) {
      const text = match[1].trim()
      if (text && !this.shouldSkipText(text)) {
        const key = this.isMatchedStr(text)
        if (key) {
          this.addMatch(text, key, 'template-text')
          result = result.replace(`>${text}<`, `>{{ $t('${key}') }}<`)
        }
      }
    }

    return result
  }

  /**
   * 转换静态属性
   */
  private transformStaticAttributes(content: string): string {
    // 匹配静态属性: attr="value"
    const attrRegex = /(\w+)="([^"]+)"/g
    let result = content
    let match

    while ((match = attrRegex.exec(content)) !== null) {
      const attrName = match[1]
      const attrValue = match[2]
      
      // 跳过已经是i18n调用的属性
      if (this.shouldSkipAttribute(attrName, attrValue)) {
        continue
      }

      const key = this.isMatchedStr(attrValue)
      if (key) {
        this.addMatch(attrValue, key, 'template-attribute')
        result = result.replace(
          `${attrName}="${attrValue}"`,
          `:${attrName}="$t('${key}')"`
        )
      }
    }

    return result
  }

  /**
   * 转换动态属性中的字符串字面量
   */
  private transformDynamicAttributes(content: string): string {
    let result = content

    // 匹配 :attr="'value'" 或 v-bind:attr="'value'"
    const dynamicAttrRegex = /(?::(\w+)|v-bind:(\w+))="'([^']+)'"/g
    let match

    while ((match = dynamicAttrRegex.exec(content)) !== null) {
      const attrName = match[1] || match[2]
      const attrValue = match[3]
      const fullMatch = match[0]

      const key = this.isMatchedStr(attrValue)
      if (key) {
        this.addMatch(attrValue, key, 'dynamic-attribute')
        const replacement = `:${attrName}="$t('${key}')"`
        result = result.replace(fullMatch, replacement)
      }
    }

    // 匹配动态属性名 :[attr]="'value'"
    const dynamicNameRegex = /:\[([^\]]+)\]="'([^']+)'"/g
    while ((match = dynamicNameRegex.exec(content)) !== null) {
      const attrName = match[1]
      const attrValue = match[2]
      const fullMatch = match[0]

      const key = this.isMatchedStr(attrValue)
      if (key) {
        this.addMatch(attrValue, key, 'dynamic-attribute-name')
        const replacement = `:[${attrName}]="$t('${key}')"`
        result = result.replace(fullMatch, replacement)
      }
    }

    return result
  }

  /**
   * 转换Vue指令中的字符串
   */
  private transformDirectiveStrings(content: string): string {
    let result = content

    // 转换 v-text="'value'" 和 v-html="'value'"
    const directiveRegex = /(v-(?:text|html))="'([^']+)'"/g
    let match

    while ((match = directiveRegex.exec(content)) !== null) {
      const directive = match[1]
      const value = match[2]
      const fullMatch = match[0]

      // 对于v-html，提取HTML标签内的文本
      let textToMatch = value
      if (directive === 'v-html') {
        // 简单提取HTML标签内的文本内容
        const htmlTextMatch = value.match(/>([^<]+)</g)
        if (htmlTextMatch && htmlTextMatch.length > 0) {
          textToMatch = htmlTextMatch[0].replace(/[><]/g, '')
        }
      }

      const key = this.isMatchedStr(textToMatch)
      if (key) {
        this.addMatch(textToMatch, key, `directive-${directive}`)
        const replacement = `${directive}="$t('${key}')"`
        result = result.replace(fullMatch, replacement)
      }
    }

    return result
  }

  /**
   * 转换组件props中的复杂表达式
   */
  private transformComplexExpressions(content: string): string {
    let result = content

    // 转换对象字面量: :config="{ text: 'Hello', label: 'World' }"
    result = this.transformObjectLiterals(result)

    // 转换数组字面量: :items="['Hello', 'World']"
    result = this.transformArrayLiterals(result)

    return result
  }

  /**
   * 转换对象字面量中的字符串
   */
  private transformObjectLiterals(content: string): string {
    // 匹配对象字面量属性
    const objectRegex = /:(\w+)="(\{[^}]+\})"/g
    let result = content
    let match

    while ((match = objectRegex.exec(content)) !== null) {
      const propName = match[1]
      const objectValue = match[2]
      const fullMatch = match[0]

      // 转换对象内的字符串
      const transformedObject = objectValue.replace(
        /'([^']+)'|"([^"]+)"/g,
        (stringMatch: string, singleQuoted: string, doubleQuoted: string) => {
          const text = singleQuoted || doubleQuoted
          const key = this.isMatchedStr(text)
          if (key) {
            this.addMatch(text, key, 'object-literal')
            return `$t('${key}')`
          }
          return stringMatch
        }
      )

      if (transformedObject !== objectValue) {
        const replacement = `:${propName}="${transformedObject}"`
        result = result.replace(fullMatch, replacement)
      }
    }

    return result
  }

  /**
   * 转换数组字面量中的字符串
   */
  private transformArrayLiterals(content: string): string {
    // 匹配数组字面量属性
    const arrayRegex = /:(\w+)="(\[[^\]]+\])"/g
    let result = content
    let match

    while ((match = arrayRegex.exec(content)) !== null) {
      const propName = match[1]
      const arrayValue = match[2]
      const fullMatch = match[0]

      // 转换数组内的字符串
      const transformedArray = arrayValue.replace(
        /'([^']+)'|"([^"]+)"/g,
        (stringMatch: string, singleQuoted: string, doubleQuoted: string) => {
          const text = singleQuoted || doubleQuoted
          const key = this.isMatchedStr(text)
          if (key) {
            this.addMatch(text, key, 'array-literal')
            return `$t('${key}')`
          }
          return stringMatch
        }
      )

      if (transformedArray !== arrayValue) {
        const replacement = `:${propName}="${transformedArray}"`
        result = result.replace(fullMatch, replacement)
      }
    }

    return result
  }

  /**
   * 检查是否应该跳过文本转换
   */
  private shouldSkipText(text: string): boolean {
    // 跳过空白字符
    if (!text.trim()) return true
    
    // 跳过已经包含$t的文本
    if (text.includes('$t(') || text.includes('$tc(')) return true
    
    // 跳过看起来像JavaScript表达式的文本
    if (text.includes('{{') || text.includes('}}')) return true
    
    return false
  }

  /**
   * 检查是否应该跳过属性转换
   */
  private shouldSkipAttribute(attrName: string, attrValue: string): boolean {
    // 跳过特殊属性
    const skipAttrs = ['v-', ':', '@', 'ref', 'key', 'is']
    if (skipAttrs.some(skip => attrName.startsWith(skip))) return true
    
    // 跳过已经包含$t的值
    if (attrValue.includes('$t(') || attrValue.includes('$tc(')) return true
    
    // 跳过URL和路径
    if (attrValue.startsWith('/') || attrValue.startsWith('http') || attrValue.startsWith('#')) return true
    
    return false
  }
} 
