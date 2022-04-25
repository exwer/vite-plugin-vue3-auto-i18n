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

export function isMatchLocaleMsg(locale: LocaleMsg, target: string): boolean {

}
