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
function addImportStatement({ types: t, template }: typeof babelCore, path: babelCore.NodePath<babelCore.types.Program>) {
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

  const i18nImport = imports.find(
    node =>
      node.type === 'ImportDeclaration'
      && node.source.value === 'vue-i18n',
  ) as babelCore.types.ImportDeclaration | undefined
  if (!i18nImport) {
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
  else {
    if (!hasImportedMember(i18nImport, 'useI18n')) {
      i18nImport.specifiers.push(
        t.importSpecifier(
          t.identifier('useI18n'),
          t.identifier('useI18n'),
        ),
      )
    }
  }

  const vueImport = imports.find(
    node =>
      node.type === 'ImportDeclaration' && node.source.value === 'vue',
  ) as babelCore.types.ImportDeclaration | undefined
  if (!vueImport) {
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
    if (!hasImportedMember(vueImport, 'ref')) {
      vueImport.specifiers.push(
        t.importSpecifier(t.identifier('ref'), t.identifier('ref')),
      )
    }
    if (!hasImportedMember(vueImport, 'computed')) {
      vueImport.specifiers.push(
        t.importSpecifier(
          t.identifier('computed'),
          t.identifier('computed'),
        ),
      )
    }
  }
}
export default function(
  babel: typeof babelCore,
): babelCore.PluginObj<VisitorState> {
  return {
    visitor: {
      Program(path) {
        addImportStatement(babel, path)
      },
      ExportDefaultDeclaration(path) {
        path.scope.traverse(path.node, {
          ObjectMethod(p) {
            if (p.node.kind === 'method' && p.node.key.type === 'Identifier' && p.node.key.name === 'setup') {
              p.scope.traverse(p.node.body, {

              })
            }
          },
        })
      },

    },
  }
}
