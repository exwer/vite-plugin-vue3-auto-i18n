import { parse, NodeTypes } from '@vue/compiler-dom'
import type { TransformFormat } from '../../types'
import { DEFAULT_TRANSFORM_FORMAT } from '../transform'
import { formatKey } from '../../utils'

interface TextMatch {
  start: number
  end: number
  content: string
  replacement: string
  type: 'text' | 'interpolation' | 'attribute' | 'binding'
}

export class VueTemplateTransformer {
  private format: TransformFormat
  private isMatchedStr: (target: string) => false | string

  constructor(
    isMatchedStr: (target: string) => false | string,
    transformFormat?: TransformFormat
  ) {
    this.isMatchedStr = isMatchedStr
    this.format = transformFormat || DEFAULT_TRANSFORM_FORMAT
  }

  async transform(sourceCode: string): Promise<string> {
    // 解析 template 为 AST 来获取需要替换的文本位置
    const ast = parse(sourceCode)
    const matches: TextMatch[] = []

    // 递归遍历所有节点，收集需要替换的文本位置
    this.collectMatches(ast, matches, sourceCode)

    // 去重：移除重叠的匹配项，保留最长的匹配
    const uniqueMatches: TextMatch[] = []
    for (const match of matches) {
      let isOverlapping = false
      for (const existing of uniqueMatches) {
        if (
          (match.start >= existing.start && match.start < existing.end) ||
          (match.end > existing.start && match.end <= existing.end) ||
          (match.start <= existing.start && match.end >= existing.end)
        ) {
          isOverlapping = true
          // 如果当前匹配更长，替换现有的
          if (match.end - match.start > existing.end - existing.start) {
            const index = uniqueMatches.indexOf(existing)
            uniqueMatches[index] = match
          }
          break
        }
      }
      if (!isOverlapping) {
        uniqueMatches.push(match)
      }
    }

    // 按位置排序，从后往前替换，避免位置偏移
    uniqueMatches.sort((a, b) => b.start - a.start)
    
    // 执行替换，保持原格式
    let result = sourceCode
    for (const match of uniqueMatches) {
      const before = result.substring(0, match.start)
      const after = result.substring(match.end)
      result = before + match.replacement + after
    }

    return result
  }

  private collectMatches(node: any, matches: TextMatch[], sourceCode: string): void {
    if (node.type === NodeTypes.TEXT) {
      // 处理文本节点，去除首尾空白字符
      const content = node.content.trim()
      if (content.length > 0) {
        const matched = this.isMatchedStr(content)
        if (matched) {
          // 直接使用 AST 节点提供的位置信息
          const nodeStart = node.loc.start.offset
          const nodeEnd = node.loc.end.offset
          const nodeContent = node.content
          
          // 找到实际文本内容在节点中的位置
          const contentStart = nodeContent.indexOf(content)
          if (contentStart !== -1) {
            const actualStart = nodeStart + contentStart
            const actualEnd = actualStart + content.length
            
            matches.push({
              start: actualStart,
              end: actualEnd,
              content,
              replacement: formatKey(matched, this.format.template),
              type: 'text'
            })
          }
        }
      }
    }
    
    // 处理插值表达式
    if (node.type === NodeTypes.INTERPOLATION && node.content && node.content.type === NodeTypes.SIMPLE_EXPRESSION) {
      const raw = node.content.content.trim()
      // 只处理字符串字面量
      if (/^'.*'$|^".*"$/.test(raw)) {
        const str = raw.slice(1, -1)
        const matched = this.isMatchedStr(str)
        if (matched && str.length > 0) {
          // 直接使用 AST 节点提供的位置信息，替换整个插值表达式
          const nodeStart = node.loc.start.offset
          const nodeEnd = node.loc.end.offset
          
          matches.push({
            start: nodeStart,
            end: nodeEnd,
            content: `{{ ${raw} }}`,
            replacement: `{{ ${formatKey(matched, this.format.interpolation)} }}`,
            type: 'interpolation'
          })
        }
      }
    }
    
    // 处理元素节点的属性
    if (node.type === NodeTypes.ELEMENT && node.props) {
      node.props.forEach((prop: any) => {
        // 静态属性
        if (prop.type === NodeTypes.ATTRIBUTE && prop.value) {
          const content = prop.value.content.trim()
          const matched = this.isMatchedStr(content)
          if (matched && content.length > 0) {
            // 直接使用 AST 节点提供的位置信息
            const propStart = prop.loc.start.offset
            const propEnd = prop.loc.end.offset
            const propContent = sourceCode.substring(propStart, propEnd)
            
            // 找到属性值在属性中的位置
            const valuePattern = `"${content}"`
            const valueStart = propContent.indexOf(valuePattern)
            if (valueStart !== -1) {
              const actualStart = propStart + valueStart + 1 // +1 for quote
              const actualEnd = actualStart + content.length
              
              matches.push({
                start: actualStart,
                end: actualEnd,
                content: `${prop.name}="${content}"`,
                replacement: `:${prop.name}="${formatKey(matched, this.format.template)}"`,
                type: 'attribute'
              })
            }
          }
        }
        
        // 动态绑定属性 :xxx="'xxx'"
        if (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.exp && prop.exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          const raw = prop.exp.content.trim()
          if (/^'.*'$|^".*"$/.test(raw)) {
            const str = raw.slice(1, -1)
            const matched = this.isMatchedStr(str)
            if (matched && str.length > 0) {
              // 直接使用 AST 节点提供的位置信息，替换整个绑定表达式
              const expStart = prop.exp.loc.start.offset
              const expEnd = prop.exp.loc.end.offset
              
              matches.push({
                start: expStart,
                end: expEnd,
                content: raw,
                replacement: formatKey(matched, this.format.interpolation),
                type: 'binding'
              })
            }
          }
        }
      })
    }
    
    // 递归处理子节点
    if (node.children) {
      node.children.forEach((child: any) => {
        this.collectMatches(child, matches, sourceCode)
      })
    }
  }
}

// 向后兼容的默认导出
export default async function templateTransformer(
  sourceCode: string,
  isMatchedStr: (target: string) => false | string,
  transformFormat?: TransformFormat
): Promise<string> {
  const transformer = new VueTemplateTransformer(isMatchedStr, transformFormat)
  return transformer.transform(sourceCode)
} 
