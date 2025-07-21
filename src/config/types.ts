import type { LocaleConfig, TransformFormat } from '../types'

/**
 * CLI配置类型
 */
export interface CLIConfig {
  scanDir: string
  outDir: string
  exts: string[]
  locale: LocaleConfig
  transformFormat?: TransformFormat
  enableScript?: boolean
  enableTemplate?: boolean
  debug?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
}

/**
 * 验证结果类型
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 配置选项类型
 */
export interface ConfigOptions {
  strict?: boolean
  allowUnknown?: boolean
  validateLocale?: boolean
} 
