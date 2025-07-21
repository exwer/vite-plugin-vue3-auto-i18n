import type { CLIConfig, ValidationResult } from './types'

/**
 * 验证配置
 */
export function validateConfig(config: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证必需字段
  if (!config.scanDir || typeof config.scanDir !== 'string') {
    errors.push('config.scanDir is required and must be a string')
  }
  
  if (!config.outDir || typeof config.outDir !== 'string') {
    errors.push('config.outDir is required and must be a string')
  }
  
  if (!config.exts || !Array.isArray(config.exts) || config.exts.length === 0) {
    errors.push('config.exts is required and must be a non-empty array')
  }
  
  if (!config.locale || typeof config.locale !== 'object' || Array.isArray(config.locale)) {
    errors.push('config.locale is required and must be an object with language keys')
  }

  // 验证文件扩展名
  if (config.exts && Array.isArray(config.exts)) {
    const supportedExts = ['.vue', '.jsx', '.tsx', '.js', '.ts']
    const unsupportedExts = config.exts.filter((ext: string) => !supportedExts.includes(ext))
    if (unsupportedExts.length > 0) {
      warnings.push(`Unsupported file extensions: ${unsupportedExts.join(', ')}`)
    }
  }

  // 验证locale结构
  if (config.locale && typeof config.locale === 'object') {
    const localeKeys = Object.keys(config.locale)
    if (localeKeys.length === 0) {
      errors.push('config.locale must contain at least one language')
    }
    
    for (const lang of localeKeys) {
      if (!config.locale[lang] || typeof config.locale[lang] !== 'object') {
        errors.push(`config.locale.${lang} must be an object`)
      }
    }
  }

  // 验证transformFormat
  if (config.transformFormat) {
    if (typeof config.transformFormat !== 'object') {
      errors.push('config.transformFormat must be an object')
    } else {
      const requiredKeys = ['template', 'script', 'interpolation']
      for (const key of requiredKeys) {
        if (!config.transformFormat[key]) {
          errors.push(`config.transformFormat.${key} is required`)
        } else {
          const format = config.transformFormat[key]
          if (typeof format !== 'string' && typeof format !== 'function') {
            errors.push(`config.transformFormat.${key} must be a string or function`)
          }
        }
      }
    }
  }

  // 验证布尔值字段
  if (config.enableScript !== undefined && typeof config.enableScript !== 'boolean') {
    errors.push('config.enableScript must be a boolean')
  }
  
  if (config.enableTemplate !== undefined && typeof config.enableTemplate !== 'boolean') {
    errors.push('config.enableTemplate must be a boolean')
  }
  
  if (config.debug !== undefined && typeof config.debug !== 'boolean') {
    errors.push('config.debug must be a boolean')
  }

  // 验证函数字段
  if (config.customMatcher !== undefined && typeof config.customMatcher !== 'function') {
    errors.push('config.customMatcher must be a function')
  }
  
  if (config.keyGenerator !== undefined && typeof config.keyGenerator !== 'function') {
    errors.push('config.keyGenerator must be a function')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
} 
