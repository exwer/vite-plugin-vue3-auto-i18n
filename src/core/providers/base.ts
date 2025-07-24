import * as t from '@babel/types'

/**
 * 定义了 i18n 转换策略的接口
 * 它告诉转换器如何生成特定 i18n 库的代码
 */
export interface I18nProvider {
  /**
   * 创建一个翻译函数的 AST 调用节点
   * @param key i18n key
   * @returns Babel AST 节点, e.g., t('key')
   */
  createTranslationAst(key: string): t.CallExpression;

  /**
   * (可选) 为不同作用域创建翻译节点
   * @param key i18n key
   * @param scope 作用域信息 ('template' | 'script' | undefined)
   * @returns Babel AST 节点, e.g., computed(() => $t('key')) for Vue script, $t('key') for Vue template
   */
  createScopedTranslationAst?(key: string, scope?: string): t.Node;

  /**
   * (可选) 获取需要注入到文件头部的 import 声明
   * @returns Babel AST 导入声明节点数组
   */
  getImportDeclarations?(): t.ImportDeclaration[];

  /**
   * (可选) 获取在注入 useTranslation 等 hooks 后需要添加的函数/变量声明
   * e.g. const { t } = useTranslation();
   */
  getHookDeclarations?(): t.VariableDeclaration[];
} 
 