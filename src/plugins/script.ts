/// @ts-check
import type { Program } from '@swc/core'
import { Visitor } from '@swc/core/Visitor.js'

class Script extends Visitor {
  // TODO:transform script
  visitProgram(n: Program): Program {
    return n
  }
}
export const ScriptPlugin = (module: Program) => new Script().visitProgram(module)
