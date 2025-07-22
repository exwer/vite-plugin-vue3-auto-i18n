import { I18nProvider } from './base';
import * as t from '@babel/types';

export const VueI18nProvider: I18nProvider = {
  createTranslationAst(key: string) {
    // 默认为script部分，需要包装在computed中以实现响应式
    return t.callExpression(
      t.identifier('computed'),
      [
        t.arrowFunctionExpression(
          [],
          t.callExpression(
            t.memberExpression(t.identifier('t'), t.identifier('value')),
            [t.stringLiteral(key)]
          )
        )
      ]
    );
  },
  
  createScopedTranslationAst(key: string, scope?: string) {
    // 对于template部分，直接使用$t调用
    if (scope === 'template') {
      return t.callExpression(
        t.memberExpression(t.thisExpression(), t.identifier('$t')),
        [t.stringLiteral(key)]
      );
    }
    // 对于script部分，只返回简单的t()调用，不包装computed
    // computed包装将在更高层级处理
    return t.callExpression(t.identifier('t'), [t.stringLiteral(key)]);
  },
  
  getImportDeclarations() {
    return [
      t.importDeclaration(
        [t.importSpecifier(t.identifier('computed'), t.identifier('computed'))],
        t.stringLiteral('vue')
      ),
      t.importDeclaration(
        [t.importSpecifier(t.identifier('useI18n'), t.identifier('useI18n'))],
        t.stringLiteral('vue-i18n')
      )
    ];
  },
  
  getHookDeclarations() {
    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(t.identifier('t'), t.identifier('t'))
          ]),
          t.callExpression(t.identifier('useI18n'), [])
        )
      ])
    ];
  }
}; 
