import { parse, transform, generate, type RootNode, type TransformContext } from '@vue/compiler-dom'
import type { NodeTypes } from '@vue/compiler-dom'
import type { I18nProvider } from '../providers/base'

export interface VueTemplateTransformOptions {
  isMatchedStr: (text: string) => string | false
  addMatch: (original: string, key: string, type: string) => void
  provider?: I18nProvider
}

/**
 * 基于AST的Vue模板转换器
 * 使用 @vue/compiler-dom 进行完整的AST转换
 */
export class VueTemplateASTTransformer {
  constructor(protected options: VueTemplateTransformOptions) {}

  /**
   * 转换Vue模板内容
   */
  transform(templateContent: string): string {
    try {
      // 解析模板为AST
      const ast = parse(templateContent)
      
      // 转换AST
      transform(ast, {
        nodeTransforms: [
          this.transformTextNode.bind(this),
          this.transformElementNode.bind(this)
        ]
      })
      
      // 生成代码
      return generate(ast).code
    } catch (error) {
      console.error('Vue template AST transformation failed:', error)
      return templateContent
    }
  }

  /**
   * 转换文本节点
   */
  protected transformTextNode(node: any, context: TransformContext) {
    if (node.type === 2 /* NodeTypes.TEXT */) {
      const text = node.content.trim()
      if (text) {
        const key = this.options.isMatchedStr(text)
        if (key) {
          this.options.addMatch(text, key, 'template-text')
          // 将文本节点转换为插值表达式
          node.type = 5 /* NodeTypes.INTERPOLATION */
          node.content = {
            type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: `$t('${key}')`,
            isStatic: false
          }
        }
      }
    }
  }

  /**
   * 转换元素节点（处理属性）
   */
  protected transformElementNode(node: any, context: TransformContext) {
    if (node.type === 1 /* NodeTypes.ELEMENT */) {
      // 转换静态属性
      if (node.props) {
        node.props.forEach((prop: any) => {
          if (prop.type === 6 /* NodeTypes.ATTRIBUTE */ && prop.value) {
            const text = prop.value.content
            const key = this.options.isMatchedStr(text)
            if (key) {
              this.options.addMatch(text, key, 'template-attribute')
              // 将静态属性转换为动态属性
              prop.type = 7 /* NodeTypes.DIRECTIVE */
              prop.name = 'bind'
              prop.arg = {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                content: prop.name,
                isStatic: true
              }
              prop.exp = {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                content: `$t('${key}')`,
                isStatic: false
              }
              delete prop.value
            }
          }
          
          // 转换动态属性中的字符串字面量
          if (prop.type === 7 /* NodeTypes.DIRECTIVE */ && prop.exp) {
            this.transformDirectiveExpression(prop)
          }
        })
      }
    }
  }

  /**
   * 转换指令表达式中的字符串
   */
  protected transformDirectiveExpression(directive: any) {
    if (!directive.exp || !directive.exp.content) return

    const content = directive.exp.content
    
    // 处理简单的字符串字面量
    const stringLiteralMatch = content.match(/^'([^']*)'$|^"([^"]*)"$/)
    if (stringLiteralMatch) {
      const text = stringLiteralMatch[1] || stringLiteralMatch[2]
      const key = this.options.isMatchedStr(text)
      if (key) {
        this.options.addMatch(text, key, 'directive-expression')
        directive.exp.content = `$t('${key}')`
      }
    }
    
    // TODO: 处理更复杂的表达式（需要JavaScript AST解析）
    // 例如: { text: 'Hello' }, ['Submit', 'Cancel'] 等
  }
}

/**
 * 高级模板转换功能
 */
export class AdvancedVueTemplateTransformer extends VueTemplateASTTransformer {
  /**
   * 转换v-text和v-html指令
   */
  protected transformDirectiveExpression(directive: any) {
    super.transformDirectiveExpression(directive)
    
    // 特殊处理v-text和v-html
    if (directive.name === 'text' || directive.name === 'html') {
      this.transformTextDirective(directive)
    }
    
    // 特殊处理v-bind
    if (directive.name === 'bind') {
      this.transformBindDirective(directive)
    }
  }

  /**
   * 转换v-text/v-html指令
   */
  private transformTextDirective(directive: any) {
    if (!directive.exp) return
    
    const content = directive.exp.content
    const stringMatch = content.match(/^'([^']*)'$|^"([^"]*)"$/)
    
    if (stringMatch) {
      const text = stringMatch[1] || stringMatch[2]
      const key = this.options.isMatchedStr(text)
      if (key) {
        this.options.addMatch(text, key, `v-${directive.name}`)
        directive.exp.content = `$t('${key}')`
      }
    }
  }

  /**
   * 转换v-bind指令
   */
  private transformBindDirective(directive: any) {
    if (!directive.exp) return
    
    // 处理对象字面量 { text: 'Hello' }
    this.transformObjectLiteral(directive.exp)
    
    // 处理数组字面量 ['Hello', 'World']
    this.transformArrayLiteral(directive.exp)
  }

  /**
   * 转换对象字面量中的字符串
   */
  private transformObjectLiteral(expression: any) {
    const content = expression.content
    const objectMatch = content.match(/^\{.*\}$/)
    
    if (objectMatch) {
      // 简单的对象字面量处理
      const transformed = content.replace(
        /'([^']+)'|"([^"]+)"/g, 
        (match: string, singleQuoted: string, doubleQuoted: string) => {
          const text = singleQuoted || doubleQuoted
          const key = this.options.isMatchedStr(text)
          if (key) {
            this.options.addMatch(text, key, 'object-literal')
            return `$t('${key}')`
          }
          return match
        }
      )
      expression.content = transformed
    }
  }

  /**
   * 转换数组字面量中的字符串
   */
  private transformArrayLiteral(expression: any) {
    const content = expression.content
    const arrayMatch = content.match(/^\[.*\]$/)
    
    if (arrayMatch) {
      const transformed = content.replace(
        /'([^']+)'|"([^"]+)"/g,
        (match: string, singleQuoted: string, doubleQuoted: string) => {
          const text = singleQuoted || doubleQuoted
          const key = this.options.isMatchedStr(text)
          if (key) {
            this.options.addMatch(text, key, 'array-literal')
            return `$t('${key}')`
          }
          return match
        }
      )
      expression.content = transformed
    }
  }
}

/**
 * 智能模板转换器 - 处理复杂场景
 */
export class SmartVueTemplateTransformer extends AdvancedVueTemplateTransformer {
  /**
   * 检查是否应该跳过转换
   */
  private shouldSkipTransform(text: string, context: any): boolean {
    // 跳过已经包含$t的文本
    if (text.includes('$t(') || text.includes('$tc(')) {
      return true
    }
    
    // 跳过JavaScript表达式
    if (this.isJavaScriptExpression(text)) {
      return true
    }
    
    // 跳过i18n-t组件内的特殊内容
    if (this.isInI18nComponent(context)) {
      return true
    }
    
    return false
  }

  /**
   * 检查是否为JavaScript表达式
   */
  private isJavaScriptExpression(text: string): boolean {
    // 简单的JavaScript表达式检测
    const jsPatterns = [
      /\|\|/, // 或操作符
      /&&/, // 且操作符
      /\?\s*:/, // 三元操作符
      /\.\w+/, // 属性访问
      /\[\w+\]/, // 数组访问
      /\w+\(.*\)/, // 函数调用
    ]
    
    return jsPatterns.some(pattern => pattern.test(text))
  }

  /**
   * 检查是否在i18n-t组件内
   */
  private isInI18nComponent(context: any): boolean {
    // 检查父节点是否为i18n-t组件
    let parent = context.parent
    while (parent) {
      if (parent.type === 1 /* NodeTypes.ELEMENT */ && parent.tag === 'i18n-t') {
        return true
      }
      parent = parent.parent
    }
    return false
  }

  /**
   * 重写文本节点转换，添加智能检查
   */
  protected transformTextNode(node: any, context: TransformContext) {
    if (node.type === 2 /* NodeTypes.TEXT */) {
      const text = node.content.trim()
      if (text && !this.shouldSkipTransform(text, context)) {
        const key = this.options.isMatchedStr(text)
        if (key) {
          this.options.addMatch(text, key, 'template-text')
          node.type = 5 /* NodeTypes.INTERPOLATION */
          node.content = {
            type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: `$t('${key}')`,
            isStatic: false
          }
        }
      }
    }
  }
} 
