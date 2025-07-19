import type babelCore from '@babel/core'
import type { LocaleMsg } from '../index'

export function hasImportedMember(
  node: babelCore.types.ImportDeclaration,
  name: string,
) {
  return node.specifiers.some(
    item =>
      item.type === 'ImportSpecifier'
      && item.imported.type === 'Identifier'
      && item.imported.name === name,
  )
}

function getPath(
  obj: Record<string, string | Record<string, any>>,
  value: string,
) {
  let path = ''
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (obj[key] === value) {
      return `.${key}`
    }
    else if (typeof obj[key] !== 'string') {
      path += getPath(obj[key] as any, value)
      if (path)
        return `.${key}${path}`
    }
  }
  return path
}

export function getMatchedMsgPath(
  locale: LocaleMsg,
  target: string,
): false | string {
  // 遍历所有语言包来查找匹配的字符串
  const languages = Object.keys(locale)
  for (const lang of languages) {
    const langData = locale[lang]
    if (!langData) continue
    
    const result = getPath(langData, target)
    if (result)
      return result.slice(1)
  }
  return false
}
