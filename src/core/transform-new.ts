import { transform as newTransform } from './transformer'
import type { TransformOptions, TransformResult } from '../types'
import { DEFAULT_TRANSFORM_FORMAT } from '../config/defaults'

/**
 * 新的转换函数，使用重构后的架构
 */
export async function transformSFC(
  sourceCode: string,
  options: TransformOptions
): Promise<string> {
  const result = await newTransform(sourceCode, options)
  
  // 如果转换过程中有错误，记录但不中断
  if (result.errors.length > 0 && options.debug) {
    console.warn('[i18ncraft] Transform warnings:', result.errors)
  }
  
  return result.code
}

/**
 * 匹配或生成键的辅助函数（保持向后兼容）
 */
export function matchOrGenerateKey(
  locale: any,
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

/**
 * 缓存匹配结果
 */
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

/**
 * 在locale中搜索文本
 */
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

/**
 * 递归搜索对象
 */
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

// 导出默认转换格式
export { DEFAULT_TRANSFORM_FORMAT } 
