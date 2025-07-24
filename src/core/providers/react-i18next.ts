import { I18nProvider } from './base'
import * as t from '@babel/types'

export const ReactI18nextProvider: I18nProvider = {
  createTranslationAst(key: string) {
    return t.callExpression(t.identifier('t'), [t.stringLiteral(key)]);
  },

  createScopedTranslationAst(key: string) {
    return t.callExpression(
      t.identifier('useMemo'),
      [
        t.arrowFunctionExpression(
          [],
          t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
        ),
        t.arrayExpression([t.identifier('t')])
      ]
    );
  },

  getImportDeclarations() {
    return [
      t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier('useTranslation'),
            t.identifier('useTranslation')
          )
        ],
        t.stringLiteral('react-i18next')
      )
    ];
  },

  getHookDeclarations() {
    return [
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(
              t.identifier('t'),
              t.identifier('t'),
              false,
              true
            )
          ]),
          t.callExpression(t.identifier('useTranslation'), [])
        )
      ])
    ];
  }
}; 
