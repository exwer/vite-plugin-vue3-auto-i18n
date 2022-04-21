/// @ts-check
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
  // TODO:transform script
  visitProgram(n: Program): Program {
    return n
  }
}
export const ScriptPlugin = (module: Program) =>
  new Script().visitProgram(module)
