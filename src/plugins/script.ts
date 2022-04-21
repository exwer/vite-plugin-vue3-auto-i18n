import type { Program } from '@swc/core'
import { Visitor } from '@swc/core/Visitor.js'

/*
1. import { useI18n } from 'vue-i18n'
  - Judging whether statement is repeated
  - at top of setup function
2. const { t } = useI18n()
  - Judging whether statement is repeated
  - below import statement of useI18n
3. ref(s) => ref(t('xxx'))
  - if theres no 'ref' imported,import ref
4. s => computed(()=>t('xxx'))
  - if theres no 'computed' imported,import computed
*/
class Script extends Visitor {
  visitProgram(n: Program): Program {
    let shouldImportI18n = true
    let shouldImportRef = true
    let shouldImportComputed = true
    n.body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        if (node.source.value === 'vue') {
          node.specifiers.forEach((node) => {
            if (
              node.type === 'ImportSpecifier'
              && node.imported
              && node.imported.type === 'Identifier'
            ) {
              if (node.imported.value === 'ref')
                shouldImportRef = false
              if (node.imported.value === 'computed')
                shouldImportComputed = false
            }
          })
        }
        if (node.source.value === 'vue-i18n')
          shouldImportI18n = false
      }
    })
    if (shouldImportI18n) {
      // Import i18n
    }
    if (shouldImportRef) {
      // import ref
    }
    if (shouldImportComputed) {
      // import computed
    }
    return n
  }
}
export const ScriptPlugin = (module: Program) =>
  new Script().visitProgram(module)
