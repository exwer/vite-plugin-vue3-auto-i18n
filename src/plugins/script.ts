import type babelCore from '@babel/core'

interface VisitorState {
  file: {
    opts: babelCore.TransformOptions
  }
}
/*
1. import { useI18n } from 'vue-i18n' ✅
  - Judging whether statement is repeated ✅
2. const { t } = useI18n()
  - Judging whether statement is repeated
  - below import statement of useI18n
3. ref(s) => ref(t('xxx'))
  - if theres no 'ref' imported,import ref ✅
4. s => computed(()=>t('xxx'))
  - if theres no 'computed' imported,import computed ✅
*/
function hasImportedMember(
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
export default function(
  babel: typeof babelCore,
): babelCore.PluginObj<VisitorState> {
  return {
    visitor: {
      Program(path) {
        const { types: t, template } = babel
        let i18nImportNode: babelCore.types.ImportDeclaration | null = null
        let vueImportNode: babelCore.types.ImportDeclaration | null = null
        let shouldImportI18n = true
        let shouldImportRef = true
        let shouldImportComputed = true
        if (path.node.body.length === 0) {
          path.node.body.push(
            template.ast(
              'import { ref,computed } from \'vue\'',
            ) as babelCore.types.Statement,
            template.ast(
              'import { useI18n } from "vue-i18n"',
            ) as babelCore.types.Statement,
          )
          path.skip()
        }

        const imports = path.node.body.filter(
          node => node.type === 'ImportDeclaration',
        )
        imports.forEach((node) => {
          if (node.type === 'ImportDeclaration') {
            if (node.source.value === 'vue-i18n') {
              i18nImportNode = node
              if (hasImportedMember(node, 'useI18n'))
                shouldImportI18n = false
            }
            if (node.source.value === 'vue') {
              vueImportNode = node
              if (hasImportedMember(node, 'ref'))
                shouldImportRef = false
              if (hasImportedMember(node, 'computed'))
                shouldImportComputed = false
            }
          }
        })
        if (!i18nImportNode) {
          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('useI18n'),
                  t.identifier('useI18n'),
                ),
              ],
              t.stringLiteral('vue-i18n'),
            ),
          )
        }
        else if (i18nImportNode && shouldImportI18n) {
          i18nImportNode.specifiers.push(
            t.importSpecifier(t.identifier('useI18n'), t.identifier('useI18n')),
          )
        }
        if (!vueImportNode) {
          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(t.identifier('ref'), t.identifier('ref')),
                t.importSpecifier(
                  t.identifier('computed'),
                  t.identifier('computed'),
                ),
              ],
              t.stringLiteral('vue'),
            ),
          )
        }
        else {
          if (shouldImportRef) {
            vueImportNode.specifiers.push(
              t.importSpecifier(t.identifier('ref'), t.identifier('ref')),
            )
          }
          if (shouldImportComputed) {
            vueImportNode.specifiers.push(
              t.importSpecifier(
                t.identifier('computed'),
                t.identifier('computed'),
              ),
            )
          }
        }
      },
    },
  }
}
