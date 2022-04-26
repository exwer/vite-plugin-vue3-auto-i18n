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

export function getMatchedMsgPath(
  locale: LocaleMsg,
  target: string,
): false | string {
  const lang = locale[Object.keys(locale)?.[0]]
  if (!lang)
    return false
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
  const result = getPath(lang, target)
  if (result)
    return result.slice(1)
  return false
}
