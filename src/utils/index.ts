// 优化：使用更高效的递归类型定义
interface LocaleObject {
  [key: string]: string | LocaleObject
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
  locale: any,
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
