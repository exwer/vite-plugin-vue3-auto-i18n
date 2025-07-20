import { baseParse, NodeTypes } from '@vue/compiler-dom'

interface TextMatch {
  start: number
  end: number
  content: string
  replacement: string
  type: 'text' | 'interpolation' | 'attribute' | 'binding'
}

export default async function templateTransformer(
  sourceCode: string,
  isMatchedStr: (target: string) => false | string,
) {
  // 解析 template 为 AST 来获取需要替换的文本位置
  const ast = baseParse(sourceCode)
  const matches: TextMatch[] = []

  // 递归遍历所有节点，收集需要替换的文本位置
  function collectMatches(node: any, offset: number = 0) {
    if (node.type === NodeTypes.TEXT) {
      const content = node.content.trim()
      const matched = isMatchedStr(content)
      if (matched && content.length > 0) {
        // 找到原始文本在源代码中的位置
        const textStart = sourceCode.indexOf(content, offset)
        if (textStart !== -1) {
          matches.push({
            start: textStart,
            end: textStart + content.length,
            content,
            replacement: `$t('${matched}')`,
            type: 'text'
          })
        }
      }
    }
    
    // 处理插值表达式
    if (node.type === NodeTypes.INTERPOLATION && node.content && node.content.type === NodeTypes.SIMPLE_EXPRESSION) {
      const raw = node.content.content.trim()
      // 只处理字符串字面量
      if (/^'.*'$|^".*"$/.test(raw)) {
        const str = raw.slice(1, -1)
        const matched = isMatchedStr(str)
        if (matched && str.length > 0) {
          // 找到原始插值在源代码中的位置
          const interpolationStart = sourceCode.indexOf(raw, offset)
          if (interpolationStart !== -1) {
            matches.push({
              start: interpolationStart,
              end: interpolationStart + raw.length,
              content: raw,
              replacement: `$t('${matched}')`,
              type: 'interpolation'
            })
          }
        }
      }
    }
    
    // 处理元素节点的属性
    if (node.type === NodeTypes.ELEMENT && node.props) {
      node.props.forEach((prop: any) => {
        // 静态属性
        if (prop.type === NodeTypes.ATTRIBUTE && prop.value) {
          const content = prop.value.content.trim()
          const matched = isMatchedStr(content)
          if (matched && content.length > 0) {
            // 找到原始属性值在源代码中的位置
            const attrPattern = `${prop.name}="${content}"`
            const attrStart = sourceCode.indexOf(attrPattern, offset)
            if (attrStart !== -1) {
              matches.push({
                start: attrStart,
                end: attrStart + attrPattern.length,
                content: attrPattern,
                replacement: `:${prop.name}="$t('${matched}')"`,
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
            const matched = isMatchedStr(str)
            if (matched && str.length > 0) {
              // 找到原始绑定表达式在源代码中的位置
              const bindStart = sourceCode.indexOf(raw, offset)
              if (bindStart !== -1) {
                matches.push({
                  start: bindStart,
                  end: bindStart + raw.length,
                  content: raw,
                  replacement: `$t('${matched}')`,
                  type: 'binding'
                })
              }
            }
          }
        }
      })
    }
    
    if (node.children) {
      node.children.forEach((child: any) => collectMatches(child, offset))
    }
  }
  
  collectMatches(ast)

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
