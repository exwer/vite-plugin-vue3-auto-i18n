import type { LocaleConfig } from '../types'

/**
 * 统一的文本匹配器
 * 基于locale配置进行文本匹配，返回对应的i18n key
 */
export class TextMatcher {
  private matchCache = new Map<string, string | false>()
  private locale: LocaleConfig

  constructor(locale: LocaleConfig) {
    this.locale = locale
  }

  /**
   * 匹配文本并返回对应的i18n key
   */
  match(text: string): string | false {
    // 检查缓存
    if (this.matchCache.has(text)) {
      return this.matchCache.get(text)!
    }
    
    // 清理文本
    const cleanText = text.trim()
    if (!cleanText) {
      this.matchCache.set(text, false)
    return false
  }

    // 在locale中查找匹配
    const key = this.findKeyInLocale(cleanText)
    this.matchCache.set(text, key)
    return key
  }

  /**
   * 在locale配置中查找文本对应的key
   */
  private findKeyInLocale(text: string): string | false {
    for (const lang of Object.keys(this.locale)) {
      const found = this.searchInObject(this.locale[lang], text, '')
      if (found) return found
    }
    return false
  }

  /**
   * 递归搜索对象中的文本
   */
  private searchInObject(obj: any, text: string, prefix: string): string | false {
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      const currentKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'string') {
        if (value === text) {
          return currentKey
      }
      } else if (typeof value === 'object' && value !== null) {
        const found = this.searchInObject(value, text, currentKey)
        if (found) return found
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

/**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.matchCache.size,
      maxSize: 1000 // 固定最大缓存大小
    }
  }
}


