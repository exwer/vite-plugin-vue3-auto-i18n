import { createUnplugin as createUnpluginBase } from 'unplugin'
import { transformSFC } from '../core/transform'
import { transformReact } from './react'
import { createError, ErrorCode } from '../core/errors'
import type { LocaleConfig, TransformFormat, PluginOptions } from '../types'

export interface UnpluginOptions extends PluginOptions {
  include?: string[]
  exclude?: string[]
}

export function createUnplugin(options: UnpluginOptions) {
  const { locale, transformFormat, include = ['**/*.{vue,js,jsx,ts,tsx}'], exclude = ['**/node_modules/**'] } = options

  if (!locale) {
    throw createError(ErrorCode.MISSING_LOCALE, 'locale configuration is required')
  }

  // 创建转换函数
  const transformInclude = (id: string) => {
    // 检查是否匹配包含模式
    const matchesInclude = include.some(pattern => {
      // 简化逻辑：直接检查文件扩展名
      if (pattern.includes('*.vue')) {
        return id.endsWith('.vue')
      }
      if (pattern.includes('*.jsx')) {
        return id.endsWith('.jsx')
      }
      if (pattern.includes('*.js')) {
        return id.endsWith('.js')
      }
      if (pattern.includes('*.ts')) {
        return id.endsWith('.ts')
      }
      if (pattern.includes('*.tsx')) {
        return id.endsWith('.tsx')
      }
      
      // 对于复杂模式，使用简单的字符串匹配
      if (pattern.includes('components/')) {
        return id.includes('components/')
      }
      
      // 对于包含多种扩展名的模式，检查所有扩展名
      if (pattern.includes('{vue,js,jsx,ts,tsx}')) {
        return id.endsWith('.vue') || id.endsWith('.js') || id.endsWith('.jsx') || id.endsWith('.ts') || id.endsWith('.tsx')
      }
      
      return false
    })

    // 检查是否匹配排除模式
    const matchesExclude = exclude.some(pattern => {
      if (pattern.includes('node_modules/')) {
        return id.includes('node_modules/')
      }
      if (pattern.includes('dist/')) {
        return id.includes('dist/')
      }
      return false
    })

    return matchesInclude && !matchesExclude
  }

  const transform = async (code: string, id: string) => {
    try {
      // 根据文件扩展名选择转换器
      if (id.endsWith('.vue')) {
        const result = await transformSFC(code, {
          locale,
          transformFormat,
          enableScript: true,
          enableTemplate: true
        })
        return {
          code: result,
          map: null
        }
      } else if (id.endsWith('.jsx') || id.endsWith('.tsx') || 
                 (id.endsWith('.js') && code.includes('jsx')) ||
                 (id.endsWith('.ts') && code.includes('jsx'))) {
        const result = transformReact(code, {
          locale,
          transformFormat
        })
        return {
          code: result.code,
          map: null
        }
      }

      // 不支持的文件类型，返回null
      return null
    } catch (error) {
      console.error(`[i18ncraft] Error transforming ${id}:`, error)
      // 返回原始代码，不中断构建
      return {
        code,
        map: null
      }
    }
  }

  // 创建unplugin插件
  const unplugin = createUnpluginBase(() => ({
    name: 'i18ncraft',
    transformInclude,
    transform
  }))

  // 返回带有直接方法的插件对象
  return {
    ...unplugin,
    name: 'i18ncraft',
    transformInclude,
    transform
  }
} 
