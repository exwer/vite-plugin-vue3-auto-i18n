import { I18nProvider } from './base';
import * as t from '@babel/types';

export const VueI18nProvider: I18nProvider = {
  createTranslationAst(key: string) {
    return t.callExpression(
      t.memberExpression(t.identifier('this'), t.identifier('$t')),
      [t.stringLiteral(key)]
    );
  },
  // Vue 的 Provider 相对简单，暂时不需要其他方法
}; 
