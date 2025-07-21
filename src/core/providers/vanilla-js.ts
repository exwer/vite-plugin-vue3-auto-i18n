import { I18nProvider } from './base'
import * as t from '@babel/types'

/**
 * 原生JavaScript i18n Provider
 * 支持多种常见的原生JS i18n模式
 */

/**
 * 基于全局i18n对象的Provider
 * 生成: i18n.t('key') 调用
 */
export const VanillaI18nProvider: I18nProvider = {
  createTranslationAst(key: string) {
    return t.callExpression(
      t.memberExpression(t.identifier('i18n'), t.identifier('t')),
      [t.stringLiteral(key)]
    )
  },

  getImportDeclarations() {
    // 假设i18n对象是全局可用的，或者通过某种方式导入
    // 这里可以根据具体项目需求调整
    return []
  }
}

/**
 * 基于函数式的Provider
 * 生成: translate('key') 调用
 */
export const VanillaFunctionProvider: I18nProvider = {
  createTranslationAst(key: string) {
    return t.callExpression(
      t.identifier('translate'),
      [t.stringLiteral(key)]
    )
  },

  getImportDeclarations() {
    // 可以根据需要导入translate函数
    return [
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('translate'))],
        t.stringLiteral('./i18n')
      )
    ]
  }
}

/**
 * 基于i18next的原生JS Provider
 * 生成: i18next.t('key') 调用
 */
export const VanillaI18nextProvider: I18nProvider = {
  createTranslationAst(key: string) {
    return t.callExpression(
      t.memberExpression(t.identifier('i18next'), t.identifier('t')),
      [t.stringLiteral(key)]
    )
  },

  getImportDeclarations() {
    return [
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('i18next'))],
        t.stringLiteral('i18next')
      )
    ]
  }
}

/**
 * 可配置的原生JS Provider工厂
 */
export function createVanillaProvider(config: {
  functionName?: string
  objectName?: string
  importPath?: string
  importType?: 'default' | 'named'
}): I18nProvider {
  const {
    functionName = 't',
    objectName,
    importPath,
    importType = 'named'
  } = config

  return {
    createTranslationAst(key: string) {
      if (objectName) {
        // 生成 objectName.functionName('key')
        return t.callExpression(
          t.memberExpression(t.identifier(objectName), t.identifier(functionName)),
          [t.stringLiteral(key)]
        )
      } else {
        // 生成 functionName('key')
        return t.callExpression(
          t.identifier(functionName),
          [t.stringLiteral(key)]
        )
      }
    },

    getImportDeclarations() {
      if (!importPath) return []

      const importName = objectName || functionName

      if (importType === 'default') {
        return [
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(importName))],
            t.stringLiteral(importPath)
          )
        ]
      } else {
        return [
          t.importDeclaration(
            [t.importSpecifier(t.identifier(importName), t.identifier(importName))],
            t.stringLiteral(importPath)
          )
        ]
      }
    }
  }
}

// 默认导出最常用的Provider
export default VanillaI18nextProvider 
