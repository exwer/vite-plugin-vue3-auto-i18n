import type { TransformOptions, TransformResult } from '../../types'

/**
 * 中间件接口
 */
export interface TransformMiddleware {
  name: string
  before?: (source: string, options: TransformOptions) => string | Promise<string>
  after?: (result: TransformResult, options: TransformOptions) => TransformResult | Promise<TransformResult>
  priority?: number // 优先级，数字越小优先级越高
}

/**
 * 中间件管理器
 */
export class MiddlewareManager {
  private middlewares: TransformMiddleware[] = []

  /**
   * 注册中间件
   */
  register(middleware: TransformMiddleware): void {
    this.middlewares.push(middleware)
    // 按优先级排序
    this.middlewares.sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }

  /**
   * 移除中间件
   */
  unregister(name: string): void {
    this.middlewares = this.middlewares.filter(m => m.name !== name)
  }

  /**
   * 执行预处理中间件
   */
  async executeBefore(source: string, options: TransformOptions): Promise<string> {
    let result = source
    
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        result = await middleware.before(result, options)
      }
    }
    
    return result
  }

  /**
   * 执行后处理中间件
   */
  async executeAfter(result: TransformResult, options: TransformOptions): Promise<TransformResult> {
    let finalResult = result
    
    for (const middleware of this.middlewares) {
      if (middleware.after) {
        finalResult = await middleware.after(finalResult, options)
      }
    }
    
    return finalResult
  }

  /**
   * 获取所有中间件
   */
  getMiddlewares(): TransformMiddleware[] {
    return [...this.middlewares]
  }

  /**
   * 清空所有中间件
   */
  clear(): void {
    this.middlewares = []
  }
}

/**
 * 全局中间件管理器实例
 */
export const globalMiddlewareManager = new MiddlewareManager()

/**
 * 便捷的中间件注册函数
 */
export function useMiddleware(middleware: TransformMiddleware): void {
  globalMiddlewareManager.register(middleware)
}

/**
 * 便捷的中间件移除函数
 */
export function removeMiddleware(name: string): void {
  globalMiddlewareManager.unregister(name)
} 
