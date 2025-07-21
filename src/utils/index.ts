// 优化：使用更高效的递归类型定义
export interface LocaleObject {
  [key: string]: string | LocaleObject
}

export interface LocaleConfig {
  [lang: string]: LocaleObject
}

// 格式化函数，支持字符串模板和函数
export function formatKey(key: string, format: string | ((key: string) => string)): string {
  if (typeof format === 'function') {
    return format(key)
  }
  // 字符串模板替换
  return format.replace(/\{\{key\}\}/g, key)
}

function getPath(
  obj: LocaleObject,
  value: string,
  currentPath: string = ''
): string {
  // 优化：使用 Object.entries 提高性能
  for (const [key, val] of Object.entries(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key
    
    if (val === value) {
      return newPath
    }
    else if (typeof val === 'object' && val !== null) {
      const result = getPath(val as LocaleObject, value, newPath)
      if (result) {
        return result
      }
    }
  }
  return ''
}

export function getMatchedMsgPath(
  locale: LocaleConfig,
  target: string,
): false | string {
  // 优化：使用 Object.keys 缓存，避免重复计算
  const languages = Object.keys(locale)
  
  for (const lang of languages) {
    const langData = locale[lang]
    if (!langData) continue
    
    const result = getPath(langData, target)
    if (result) {
      return result
    }
  }
  return false
}

// 导出错误相关
export * from '../core/errors'
