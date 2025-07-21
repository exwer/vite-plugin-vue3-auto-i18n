import type { LocaleConfig, TransformOptions } from '../types'

/**
 * 统一的文本匹配器
 */
export class TextMatcher {
  private matchCache = new Map<string, string | false>()
  private locale: LocaleConfig
  private customMatcher?: TransformOptions['customMatcher']
  private keyGenerator?: TransformOptions['keyGenerator']

  constructor(locale: LocaleConfig, options: Pick<TransformOptions, 'customMatcher' | 'keyGenerator'> = {}) {
    this.locale = locale
    this.customMatcher = options.customMatcher
    this.keyGenerator = options.keyGenerator
  }

  /**
   * 匹配或生成键
   */
  match(text: string): string | false {
    // 首先尝试自定义匹配器
    if (this.customMatcher) {
      const result = this.customMatcher(text)
      if (result) return result
    }
    
    // 使用缓存匹配器
    const matched = this.getCachedMatch(text)
    if (matched) return matched
    
    // 最后尝试键生成器
    if (this.keyGenerator) return this.keyGenerator(text)
    
    return false
  }

  /**
   * 获取缓存的匹配结果
   */
  private getCachedMatch(text: string): string | false {
    if (this.matchCache.has(text)) {
      return this.matchCache.get(text) || false
    }
    
    const result = this.searchInLocale(text)
    this.matchCache.set(text, result || false)
    return result
  }

  /**
   * 在locale中搜索文本
   */
  private searchInLocale(text: string): string | false {
    const languages = Object.keys(this.locale)
    
    for (const lang of languages) {
      const langData = this.locale[lang]
      if (!langData) continue
      
      const result = this.searchInObject(langData, text)
      if (result) {
        return result
      }
    }
    return false
  }

  /**
   * 递归搜索对象
   */
  private searchInObject(obj: any, value: string, currentPath: string = ''): string | false {
    for (const [key, val] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key
      
      if (val === value) {
        return newPath
      }
      else if (typeof val === 'object' && val !== null) {
        const result = this.searchInObject(val, value, newPath)
        if (result) {
          return result
        }
      }
    }
    return false
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.matchCache.clear()
  }
}

/**
 * 全局匹配器实例（用于向后兼容）
 */
let globalMatcher: TextMatcher | null = null

/**
 * 设置全局匹配器
 */
export function setGlobalMatcher(matcher: TextMatcher): void {
  globalMatcher = matcher
}

/**
 * 获取全局匹配器
 */
export function getGlobalMatcher(): TextMatcher | null {
  return globalMatcher
}

/**
 * 向后兼容的匹配函数
 */
export function matchOrGenerateKey(
  locale: LocaleConfig,
  customMatcher: TransformOptions['customMatcher'],
  keyGenerator: TransformOptions['keyGenerator'],
  text: string
): string | false {
  const matcher = new TextMatcher(locale, { customMatcher, keyGenerator })
  return matcher.match(text)
} 
