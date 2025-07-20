import { baseParse, NodeTypes } from '@vue/compiler-dom'

export default async function templateTransformer(
  sourceCode: string,
  isMatchedStr: (target: string) => false | string,
) {
  // 解析 template 为 AST
  const ast = baseParse(sourceCode)

  // 递归遍历所有节点
  function traverse(node: any) {
    if (node.type === NodeTypes.TEXT) {
      const content = node.content.trim()
      const matched = isMatchedStr(content)
      // 只替换完全匹配的文本节点，忽略空白和未匹配
      if (matched && content.length > 0) {
        node.content = node.content.replace(content, `$t('${matched}')`)
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
          node.content.content = `$t('${matched}')`
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
          // 替换匹配的属性值，并将属性名加冒号
          if (matched && content.length > 0) {
            prop.name = `:${prop.name}`
            prop.value.content = `$t('${matched}')`
          }
        }
        // 动态绑定属性 :xxx="'xxx'"
        if (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.exp && prop.exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          const raw = prop.exp.content.trim()
          if (/^'.*'$|^".*"$/.test(raw)) {
            const str = raw.slice(1, -1)
            const matched = isMatchedStr(str)
            if (matched && str.length > 0) {
              prop.exp.content = `$t('${matched}')`
            }
          }
        }
      })
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }
  traverse(ast)

  // 优化：重新生成 template 字符串，使用更高效的字符串拼接
  function gen(node: any): string {
    if (node.type === NodeTypes.ROOT) {
      return node.children.map(gen).join('')
    }
    if (node.type === NodeTypes.ELEMENT) {
      const tag = node.tag
      const attrs = node.props.map((p: any) => {
        if (p.type === NodeTypes.ATTRIBUTE) {
          if (p.value) {
            // 如果属性名以冒号开头，属性值为表达式
            if (p.name.startsWith(':')) {
              return ` ${p.name}="${p.value.content}"`
            }
            return ` ${p.name}="${p.value.content}"`
          }
          return ` ${p.name}`
        } else if (p.type === NodeTypes.DIRECTIVE) {
          // 只处理最常见的 v-if/v-else/v-once 和 v-bind
          if (p.name === 'bind' && p.arg && p.exp) {
            // v-bind:xxx="exp" => :xxx="exp"
            return ` :${p.arg.content}="${p.exp.content}"`
          } else if (p.name === 'bind' && !p.arg && p.exp) {
            // v-bind="exp"
            return ` v-bind="${p.exp.content}"`
          }
          let exp = ''
          if (p.exp) exp = `=\"${p.exp.content}\"`
          return ` v-${p.name}${exp}`
        }
        return ''
      }).join('')
      
      // 优化：使用更高效的字符串拼接
      const children = node.children.map(gen).join('')
      return `<${tag}${attrs}>${children}</${tag}>`
    }
    if (node.type === NodeTypes.TEXT) {
      return node.content
    }
    if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
      return node.children.map((c: any) => typeof c === 'string' ? c : gen(c)).join('')
    }
    if (node.type === NodeTypes.IF) {
      return node.branches.map(gen).join('')
    }
    if (node.type === NodeTypes.IF_BRANCH) {
      return node.children.map(gen).join('')
    }
    if (node.type === NodeTypes.ELEMENT && node.tag === 'template') {
      return `<template>${node.children.map(gen).join('')}</template>`
    }
    if (node.type === NodeTypes.INTERPOLATION) {
      return `{{ ${node.content.content} }}`
    }
    return ''
  }

  return gen(ast)
}
