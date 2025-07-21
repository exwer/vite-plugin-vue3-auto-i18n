import type { TransformOptions, TransformResult } from '../../types'
import type { TransformMiddleware } from './index'

/**
 * 性能监控中间件
 */
export const performanceMiddleware: TransformMiddleware = {
  name: 'performance',
  priority: 1,
  before: (source: string, options: TransformOptions) => {
    if (options.debug) {
      console.time('[i18ncraft] transform performance')
    }
    return source
  },
  after: (result: TransformResult, options: TransformOptions) => {
    if (options.debug) {
      console.timeEnd('[i18ncraft] transform performance')
    }
    return result
  }
}

/**
 * 日志记录中间件
 */
export const loggingMiddleware: TransformMiddleware = {
  name: 'logging',
  priority: 2,
  before: (source: string, options: TransformOptions) => {
    if (options.debug) {
      console.log('[i18ncraft] Starting transformation')
      console.log('[i18ncraft] Source length:', source.length)
    }
    return source
  },
  after: (result: TransformResult, options: TransformOptions) => {
    if (options.debug) {
      console.log('[i18ncraft] Transformation completed')
      console.log('[i18ncraft] Matches found:', result.matches.length)
      console.log('[i18ncraft] Errors:', result.errors.length)
    }
    return result
  }
}

/**
 * 错误处理中间件
 */
export const errorHandlingMiddleware: TransformMiddleware = {
  name: 'error-handling',
  priority: 3,
  after: (result: TransformResult, options: TransformOptions) => {
    if (result.errors.length > 0 && options.debug) {
      console.warn('[i18ncraft] Transformation completed with errors:')
      result.errors.forEach((error, index) => {
        console.warn(`[i18ncraft] Error ${index + 1}:`, error.message)
      })
    }
    return result
  }
}

/**
 * 代码格式化中间件
 */
export const formattingMiddleware: TransformMiddleware = {
  name: 'formatting',
  priority: 10,
  after: (result: TransformResult, options: TransformOptions) => {
    // 这里可以添加代码格式化逻辑
    // 例如：使用 prettier 格式化代码
    return result
  }
}

/**
 * 统计信息中间件
 */
export const statisticsMiddleware: TransformMiddleware = {
  name: 'statistics',
  priority: 20,
  after: (result: TransformResult, options: TransformOptions) => {
    if (options.debug) {
      const stats = {
        totalMatches: result.matches.length,
        uniqueKeys: new Set(result.matches.map(m => m.key)).size,
        errorCount: result.errors.length,
        successRate: result.errors.length === 0 ? 100 : 
          Math.round((result.matches.length / (result.matches.length + result.errors.length)) * 100)
      }
      console.log('[i18ncraft] Statistics:', stats)
    }
    return result
  }
}

/**
 * 缓存中间件
 */
export const cacheMiddleware: TransformMiddleware = {
  name: 'cache',
  priority: 0,
  before: (source: string, options: TransformOptions) => {
    // 这里可以实现缓存逻辑
    // 例如：检查是否有缓存的转换结果
    return source
  },
  after: (result: TransformResult, options: TransformOptions) => {
    // 这里可以缓存转换结果
    return result
  }
}

/**
 * 获取所有内置中间件
 */
export function getBuiltinMiddlewares(): TransformMiddleware[] {
  return [
    performanceMiddleware,
    loggingMiddleware,
    errorHandlingMiddleware,
    formattingMiddleware,
    statisticsMiddleware,
    cacheMiddleware
  ]
} 
