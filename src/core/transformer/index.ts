import { BaseTransformer } from './base'
import { VueTransformer } from './vue'
import { ReactTransformer } from './react'
import type { TransformOptions, TransformResult } from '../../types'

export { BaseTransformer } from './base'
export { VueTransformer } from './vue'
export { ReactTransformer } from './react'

/**
 * 转换器工厂函数
 */
export function createTransformer(sourceCode: string, options: TransformOptions): BaseTransformer {
  // 根据文件扩展名或内容判断使用哪个转换器
  if (sourceCode.includes('<template>') || sourceCode.includes('<script')) {
    return new VueTransformer(sourceCode, options)
  } else if (sourceCode.includes('jsx') || sourceCode.includes('JSX')) {
    return new ReactTransformer(sourceCode, options)
  } else {
    // 默认使用Vue转换器
    return new VueTransformer(sourceCode, options)
  }
}

/**
 * 便捷的转换函数
 */
export async function transform(sourceCode: string, options: TransformOptions): Promise<TransformResult> {
  const transformer = createTransformer(sourceCode, options)
  return await transformer.transform()
} 
