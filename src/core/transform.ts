import { createTransformer } from './transformer'
import { createError, ErrorCode } from './errors'
import { matchOrGenerateKey } from './matcher'
import type { 
  TransformOptions, 
  LocaleConfig, 
  FileProcessResult 
} from '../types'

/**
 * 向后兼容的SFC转换函数
 * @deprecated 推荐使用新的 transformer 架构
 */
export async function transformSFC(
  sourceCode: string,
  options: TransformOptions
): Promise<string> {
  try {
    // 验证locale配置
    if (!options.locale || typeof options.locale !== 'object') {
      throw createError(
        ErrorCode.MISSING_LOCALE,
        'options.locale is required and must be an object',
        { received: options.locale }
      )
    }

    // 使用新的transformer架构
    const transformer = createTransformer(sourceCode, options)
    const result = await transformer.transform()
    
    return result.code
  } catch (error) {
    console.error('[i18ncraft] Transform error:', error)
    return sourceCode // 返回原始代码作为fallback
  }
}

/**
 * 向后兼容的匹配函数
 * @deprecated 推荐使用 TextMatcher 类
 */
export { matchOrGenerateKey }

/**
 * 批量处理文件
 */
export async function processFile(
  filePath: string,
  sourceCode: string,
  options: TransformOptions
): Promise<FileProcessResult> {
  const startTime = Date.now()
  
  try {
    const result = await transformSFC(sourceCode, options)
    const processingTime = Date.now() - startTime
    
    return {
      success: true,
      filePath,
      stats: {
        transformedStrings: 0, // TODO: 从result中获取实际数量
        processingTime
      }
    }
  } catch (error) {
    return {
      success: false,
      filePath,
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 
