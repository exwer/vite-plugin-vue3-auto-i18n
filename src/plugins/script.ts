import type babelCore from '@babel/core'
import { template } from '@babel/core'
import { hasImportedMember } from '../utils/index'
interface VisitorState {
  file: {
    opts: babelCore.TransformOptions
  }
}

function replaceMatchedStr(
  node: babelCore.NodePath<
  babelCore.types.Program | babelCore.types.ObjectMethod
  >,
  isMatchedStr: (target: string) => false | string,
) {
  node.traverse({
    StringLiteral(path) {
      // 跳过 import ... from 'xxx'
      if (path.parentPath.node.type === 'ImportDeclaration') return
      const val = isMatchedStr(path.node.value)
      if (val) {
        // ref('xxx')
        if (
          path.parentPath.node.type === 'CallExpression'
          && path.parentPath.node.callee.type === 'Identifier'
          && path.parentPath.node.callee.name === 'ref'
        ) {
          path.replaceWith(template.expression.ast(`$t('${val}')`))
        }
        // 数组/对象字面量中的字符串
        else if (
          path.parentPath.node.type === 'ArrayExpression'
          || path.parentPath.node.type === 'ObjectProperty'
        ) {
          path.replaceWith(template.expression.ast(`$t('${val}')`))
        }
        // 其它情况
        else {
          path.replaceWith(template.statement.ast(`computed(()=>$t('${val}'))`))
          path.skip()
        }
      }
    },
  })
}

export default function(
  babel: typeof babelCore,
  { isMatchedStr }: { isMatchedStr: (target: string) => false | string },
): babelCore.PluginObj<VisitorState> {
  return {
    visitor: {
      Program(path) {
        replaceMatchedStr(path, isMatchedStr)
      },
    },
  }
}
