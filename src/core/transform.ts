import { parse as parseSFC } from '@vue/compiler-sfc'
import templateTransformer from '../plugins/template'
import { transformScript } from '../plugins/script'
import { getMatchedMsgPath, LocaleConfig, formatKey, createError, ErrorCode } from '../utils'

// 默认的 Vue 转换格式
export const DEFAULT_TRANSFORM_FORMAT = {
  template: (key: string) => `$t('${key}')`,
  script: (key: string) => `computed(() => $t('${key}'))`,
  interpolation: (key: string) => `$t('${key}')`
}

export interface TransformFormat {
  template: string | ((key: string) => string)
  script: string | ((key: string) => string)
  interpolation: string | ((key: string) => string)
}

export interface TransformOptions {
  locale: LocaleConfig
  enableScript?: boolean
  enableTemplate?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
  debug?: boolean
  transformFormat?: TransformFormat
}

export function matchOrGenerateKey(
  locale: LocaleConfig,
  customMatcher: TransformOptions['customMatcher'],
  keyGenerator: TransformOptions['keyGenerator'],
  text: string
) {
  if (customMatcher) {
    const res = customMatcher(text)
    if (res) return res
  }
  const matched = getMatchedMsgPath(locale, text)
  if (matched) return matched
  if (keyGenerator) return keyGenerator(text)
  return false
}

export async function transformSFC(
  sourceCode: string,
  options: TransformOptions
): Promise<string> {
  const { 
    locale, 
    enableScript = true, 
    enableTemplate = true, 
    customMatcher, 
    keyGenerator, 
    debug,
    transformFormat = DEFAULT_TRANSFORM_FORMAT
  } = options
  
  if (!locale) {
    throw createError(
      ErrorCode.MISSING_LOCALE,
      'config.locale is required',
      { received: locale }
    )
  }
  
  if (typeof locale !== 'object' || Array.isArray(locale)) {
    throw createError(
      ErrorCode.INVALID_LOCALE,
      'config.locale must be an object with language keys',
      { received: locale, type: typeof locale }
    )
  }
  
  const { descriptor } = parseSFC(sourceCode)
  const scriptSetup = descriptor.scriptSetup
  const script = descriptor.script
  const template = descriptor.template
  
  const isMatchedStr = (text: string) => matchOrGenerateKey(locale, customMatcher, keyGenerator, text)

  let result = sourceCode

  // 模板转换
  if (enableTemplate && template) {
    try {
      const templateOut = await templateTransformer(template.content, isMatchedStr, transformFormat)
      // 使用 descriptor 提供的位置信息
      const start = template.loc.start.offset
      const end = template.loc.end.offset
      result = result.substring(0, start) + templateOut + result.substring(end)
    } catch (error) {
      if (debug) {
        console.error('[i18ncraft] template transform error:', error)
      }
      // 如果是语法错误，包装成更友好的错误信息
      if (error instanceof Error && error.message.includes('parse')) {
        throw createError(
          ErrorCode.TEMPLATE_SYNTAX_ERROR,
          `Template syntax error: ${error.message}`,
          { originalError: error }
        )
      }
      throw error
    }
  }
  
  // 脚本转换 - 优先处理 scriptSetup，如果没有则处理 script
  const scriptBlock = scriptSetup || script
  if (enableScript && scriptBlock) {
    try {
      const scriptOut = await transformScript(scriptBlock.content, isMatchedStr, transformFormat)
      // 使用 descriptor 提供的位置信息
      const start = scriptBlock.loc.start.offset
      const end = scriptBlock.loc.end.offset
      result = result.substring(0, start) + scriptOut + result.substring(end)
    } catch (error) {
      if (debug) {
        console.error('[i18ncraft] script transform error:', error)
      }
      // 如果是语法错误，包装成更友好的错误信息
      if (error instanceof Error && error.message.includes('Unexpected')) {
        throw createError(
          ErrorCode.SCRIPT_SYNTAX_ERROR,
          `Script syntax error: ${error.message}`,
          { originalError: error }
        )
      }
      throw error
    }
  }
  
  if (debug) {
    console.log('[i18ncraft] transformed SFC')
  }
  
  return result
} 
