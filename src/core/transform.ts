import { parse } from '@vue/compiler-sfc'
import templateTransformer from '../plugins/template'
import { transformScript } from '../plugins/script'
import { createError, ErrorCode } from '../utils/errors'
import type { 
  TransformOptions, 
  LocaleConfig, 
  TransformFormat,
  FileProcessResult 
} from '../types'

// 默认转换格式
export const DEFAULT_TRANSFORM_FORMAT: TransformFormat = {
  template: (key: string) => `$t('${key}')`,
  script: (key: string) => `computed(() => $t('${key}'))`,
  interpolation: (key: string) => `$t('${key}')`
}

// 缓存匹配结果
const matchCache = new Map<string, Map<string, string | false>>()

function getCachedMatch(locale: any, text: string): string | false {
  const localeKey = JSON.stringify(locale)
  
  if (!matchCache.has(localeKey)) {
    matchCache.set(localeKey, new Map())
  }
  
  const cache = matchCache.get(localeKey)!
  
  if (cache.has(text)) {
    return cache.get(text) || false
  }
  
  const result = searchInLocale(locale, text)
  cache.set(text, result || false)
  return result
}

// 在locale中搜索文本
function searchInLocale(locale: any, text: string): string | false {
  const languages = Object.keys(locale)
  
  for (const lang of languages) {
    const langData = locale[lang]
    if (!langData) continue
    
    const result = searchInObject(langData, text)
    if (result) {
      return result
    }
  }
  return false
}

// 递归搜索对象
function searchInObject(obj: any, value: string, currentPath: string = ''): string | false {
  for (const [key, val] of Object.entries(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key
    
    if (val === value) {
      return newPath
    }
    else if (typeof val === 'object' && val !== null) {
      const result = searchInObject(val, value, newPath)
      if (result) {
        return result
      }
    }
  }
  return false
}

// 匹配或生成键的辅助函数
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
  
  // 使用缓存匹配器
  const matched = getCachedMatch(locale, text)
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

// 解析 SFC 的辅助函数
function parseSFC(sourceCode: string) {
  try {
    return parse(sourceCode)
  } catch (error) {
    throw createError(
      ErrorCode.PARSE_ERROR,
      'Failed to parse Vue SFC',
      { originalError: error }
    )
  }
} 
