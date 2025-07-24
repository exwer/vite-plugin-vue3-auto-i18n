import { BaseTransformer } from './base'
import { VueTransformer } from './vue'
import { ReactTransformer } from './react'
import { JavaScriptTransformer } from './javascript'
import type { TransformOptions, TransformResult } from '../../types'

export { BaseTransformer } from './base'
export { VueTransformer } from './vue'
export { ReactTransformer } from './react'
export { JavaScriptTransformer } from './javascript'

/**
 * 转换器工厂函数
 */
export function createTransformer(sourceCode: string, options: TransformOptions): BaseTransformer {
  // 根据文件扩展名或内容判断使用哪个转换器
  if (sourceCode.includes('<template>') || sourceCode.includes('<script')) {
    return new VueTransformer(sourceCode, options)
  } else if (sourceCode.includes('jsx') || sourceCode.includes('JSX') || sourceCode.includes('React')) {
    return new ReactTransformer(sourceCode, options)
  } else {
    // 默认使用JavaScript转换器（支持原生JS）
    return new JavaScriptTransformer(sourceCode, options)
  }
}

/**
 * 便捷的转换函数
 */
export async function transform(sourceCode: string, options: TransformOptions): Promise<TransformResult> {
  const transformer = createTransformer(sourceCode, options)
  return await transformer.transform()
} 
