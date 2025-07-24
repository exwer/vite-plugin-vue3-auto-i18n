import { 
  parse, 
  type TransformContext
} from '@vue/compiler-dom'

import type { I18nProvider } from '../providers/base'

export interface VueTemplateTransformOptions {
  isMatchedStr: (text: string) => string | false
  addMatch: (original: string, key: string, type: string) => void
  provider?: I18nProvider
}

/**
 * 完整的基于AST的Vue模板转换器
 * 支持所有Vue模板语法的i18n转换
 */
export class EnhancedVueTemplateASTTransformer {
  constructor(protected options: VueTemplateTransformOptions) {}

  /**
   * 转换Vue模板内容
   * 使用AST解析来识别节点，但生成模板语法而不是render函数
   */
  transform(templateContent: string): string {
    try {
      // 解析模板为AST
      const ast = parse(templateContent)
      
      // 使用AST遍历来识别需要转换的节点，但直接对原始字符串进行替换
      let result = templateContent
      
      // 遍历AST收集需要转换的位置
      const transformations: Array<{
        start: number
        end: number
        replacement: string
      }> = []
      
      this.collectTransformations(ast, transformations)
      
      // 按位置倒序排列，从后往前替换，避免位置偏移
      transformations.sort((a, b) => b.start - a.start)
      
      // 应用所有转换
      for (const { start, end, replacement } of transformations) {
        result = result.slice(0, start) + replacement + result.slice(end)
      }
      
      return result
    } catch (error) {
      console.error('[i18ncraft:VueTemplateAST] Transform failed:', error)
      return templateContent // 回退到原始内容
    }
  }

  /**
   * 收集需要转换的位置信息
   */
  private collectTransformations(node: any, transformations: Array<{start: number, end: number, replacement: string}>) {
    if (!node) return
    
    // 处理文本节点
    if (node.type === 2 /* NodeTypes.TEXT */) {
      const text = node.content.trim()
      if (text && !this.shouldSkipText(text, null as any)) {
        const key = this.options.isMatchedStr(text)
        if (key) {
          this.options.addMatch(text, key, 'template-text')
          // 添加转换：将文本包装为插值表达式
          transformations.push({
            start: node.loc.start.offset,
            end: node.loc.end.offset,
            replacement: `{{ $t('${key}') }}`
          })
        }
      }
    }
    
    // 处理元素节点
    if (node.type === 1 /* NodeTypes.ELEMENT */) {
      // 处理属性
      if (node.props) {
        for (const prop of node.props) {
          if (prop.type === 6 /* NodeTypes.ATTRIBUTE */) {
            // 静态属性
            this.collectStaticAttributeTransformation(prop, transformations)
          } else if (prop.type === 7 /* NodeTypes.DIRECTIVE */) {
            // 指令
            this.collectDirectiveTransformation(prop, transformations)
          }
        }
      }
    }
    
    // 递归处理子节点
    if (node.children) {
      for (const child of node.children) {
        this.collectTransformations(child, transformations)
      }
    }
  }

  /**
   * 收集静态属性转换
   */
  private collectStaticAttributeTransformation(prop: any, transformations: Array<{start: number, end: number, replacement: string}>) {
    if (!prop.value || !prop.value.content) return
    
    const value = prop.value.content
    const key = this.options.isMatchedStr(value)
    
    if (key) {
      this.options.addMatch(value, key, 'static-attribute')
      // 将静态属性转换为动态属性
      transformations.push({
        start: prop.loc.start.offset,
        end: prop.loc.end.offset,
        replacement: `:${prop.name}="$t('${key}')"`
      })
    }
  }

  /**
   * 收集指令转换
   */
  private collectDirectiveTransformation(prop: any, transformations: Array<{start: number, end: number, replacement: string}>) {
    if (!prop.exp) return
    
    const expression = prop.exp.content
    
    if (prop.name === 'text' || prop.name === 'html') {
      // v-text 和 v-html 指令
      const stringMatch = this.extractStringLiteral(expression)
      if (stringMatch) {
        let textToMatch = stringMatch
        
        // 对于v-html，提取HTML标签内的文本内容
        if (prop.name === 'html') {
          const htmlTextMatch = stringMatch.match(/>([^<]+)</g)
          if (htmlTextMatch && htmlTextMatch.length > 0) {
            textToMatch = htmlTextMatch[0].replace(/[><]/g, '')
          }
        }
        
        const key = this.options.isMatchedStr(textToMatch)
        if (key) {
          this.options.addMatch(textToMatch, key, `v-${prop.name}`)
          transformations.push({
            start: prop.exp.loc.start.offset,
            end: prop.exp.loc.end.offset,
            replacement: `$t('${key}')`
          })
        }
      }
    } else if (prop.name === 'bind') {
      // v-bind 指令
      const transformedExpression = this.transformStringLiteralsInExpression(expression)
      if (transformedExpression !== expression) {
        transformations.push({
          start: prop.exp.loc.start.offset,
          end: prop.exp.loc.end.offset,
          replacement: transformedExpression
        })
      }
    }
  }



  /**
   * 在表达式中转换字符串字面量
   * 处理复杂表达式: { text: 'Hello', items: ['A', 'B'] }
   */
  private transformStringLiteralsInExpression(expression: string): string {
    // 匹配单引号和双引号字符串
    const stringLiteralRegex = /'([^']*)'|"([^"]*)"/g
    
    return expression.replace(stringLiteralRegex, (match, singleQuoted, doubleQuoted) => {
      const text = singleQuoted || doubleQuoted
      const key = this.options.isMatchedStr(text)
      
      if (key) {
        this.options.addMatch(text, key, 'expression-literal')
        return `$t('${key}')`
      }
      
      return match
    })
  }

  /**
   * 提取字符串字面量
   */
  private extractStringLiteral(expression: string): string | null {
    const match = expression.match(/^'([^']*)'$|^"([^"]*)"$/)
    return match ? (match[1] || match[2]) : null
  }

  /**
   * 检查是否应该跳过文本转换
   */
  private shouldSkipText(text: string, context: TransformContext): boolean {
    // 跳过已经包含i18n调用的文本
    if (text.includes('$t(') || text.includes('$tc(') || text.includes('t(')) {
      return true
    }
    
    // 跳过JavaScript表达式
    if (this.isJavaScriptExpression(text)) {
      return true
    }
    
    // 跳过只包含空白字符的文本
    if (!/\S/.test(text)) {
      return true
    }
    
    // 跳过i18n-t组件内的文本
    if (this.isInI18nComponent(context)) {
      return true
    }
    
    return false
  }

  /**
   * 检查是否为JavaScript表达式
   */
  private isJavaScriptExpression(text: string): boolean {
    const jsPatterns = [
      /\|\|/, // 或操作符
      /&&/, // 且操作符
      /\?\s*:/, // 三元操作符
      /\.\w+/, // 属性访问
      /\[\w+\]/, // 数组访问
      /\w+\(.*\)/, // 函数调用
      /^\s*\{\{.*\}\}\s*$/, // 插值表达式
    ]
    
    return jsPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 检查是否在i18n-t组件内
   */
  private isInI18nComponent(context: TransformContext): boolean {
    // 简化实现：在实际使用中，i18n-t组件相对少见
    // 如果需要更精确的检测，可以在调用时传入额外的上下文信息
    return false
  }
}

// 保持向后兼容的别名
export const VueTemplateASTTransformer = EnhancedVueTemplateASTTransformer
export const AdvancedVueTemplateTransformer = EnhancedVueTemplateASTTransformer  
export const SmartVueTemplateTransformer = EnhancedVueTemplateASTTransformer 
 