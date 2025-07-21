import type { LocaleConfig, TransformFormat } from '../types'

// 基础配置接口
export interface BaseConfig {
  locale: LocaleConfig
  transformFormat?: TransformFormat
  debug?: boolean
}

// 转换选项配置
export interface TransformConfig extends BaseConfig {
  enableScript?: boolean
  enableTemplate?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
}

// CLI配置
export interface CLIConfig extends BaseConfig {
  scanDir: string
  outDir: string
  exts: string[]
  enableScript?: boolean
  enableTemplate?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
}

// 插件配置
export interface PluginConfig extends BaseConfig {
  include?: string[]
  exclude?: string[]
  enableScript?: boolean
  enableTemplate?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
}

// 默认配置
export const DEFAULT_CONFIG: CLIConfig = {
  scanDir: 'src',
  outDir: 'i18n_out',
  exts: ['.vue'],
  locale: {},
  enableScript: true,
  enableTemplate: true,
  debug: false
}

// 配置验证结果
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 配置验证器
export class ConfigValidator {
  static validateCLIConfig(config: Partial<CLIConfig>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 必需字段验证
    if (!config.scanDir) {
      errors.push('scanDir is required')
    }
    if (!config.outDir) {
      errors.push('outDir is required')
    }
    if (!config.locale) {
      errors.push('locale is required')
    }
    if (!config.exts || config.exts.length === 0) {
      errors.push('exts must be a non-empty array')
    }

    // 类型验证
    if (config.locale && (typeof config.locale !== 'object' || Array.isArray(config.locale))) {
      errors.push('locale must be an object with language keys')
    }

    if (config.exts && (!Array.isArray(config.exts) || !config.exts.every(ext => typeof ext === 'string'))) {
      errors.push('exts must be an array of strings')
    }

    // 路径验证
    if (config.scanDir && typeof config.scanDir !== 'string') {
      errors.push('scanDir must be a string')
    }
    if (config.outDir && typeof config.outDir !== 'string') {
      errors.push('outDir must be a string')
    }

    // 警告
    if (config.debug && typeof config.debug !== 'boolean') {
      warnings.push('debug should be a boolean')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validateTransformConfig(config: Partial<TransformConfig>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 必需字段验证
    if (!config.locale) {
      errors.push('locale is required')
    }

    // 类型验证
    if (config.locale && (typeof config.locale !== 'object' || Array.isArray(config.locale))) {
      errors.push('locale must be an object with language keys')
    }

    // 函数验证
    if (config.customMatcher && typeof config.customMatcher !== 'function') {
      errors.push('customMatcher must be a function')
    }
    if (config.keyGenerator && typeof config.keyGenerator !== 'function') {
      errors.push('keyGenerator must be a function')
    }

    // 布尔值验证
    if (config.enableScript !== undefined && typeof config.enableScript !== 'boolean') {
      warnings.push('enableScript should be a boolean')
    }
    if (config.enableTemplate !== undefined && typeof config.enableTemplate !== 'boolean') {
      warnings.push('enableTemplate should be a boolean')
    }
    if (config.debug !== undefined && typeof config.debug !== 'boolean') {
      warnings.push('debug should be a boolean')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  static validatePluginConfig(config: Partial<PluginConfig>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 必需字段验证
    if (!config.locale) {
      errors.push('locale is required')
    }

    // 类型验证
    if (config.locale && (typeof config.locale !== 'object' || Array.isArray(config.locale))) {
      errors.push('locale must be an object with language keys')
    }

    // 数组验证
    if (config.include && (!Array.isArray(config.include) || !config.include.every(pattern => typeof pattern === 'string'))) {
      errors.push('include must be an array of strings')
    }
    if (config.exclude && (!Array.isArray(config.exclude) || !config.exclude.every(pattern => typeof pattern === 'string'))) {
      errors.push('exclude must be an array of strings')
    }

    // 函数验证
    if (config.customMatcher && typeof config.customMatcher !== 'function') {
      errors.push('customMatcher must be a function')
    }
    if (config.keyGenerator && typeof config.keyGenerator !== 'function') {
      errors.push('keyGenerator must be a function')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// 配置管理器
export class UnifiedConfigManager {
  private config: CLIConfig

  constructor(config?: Partial<CLIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  getConfig(): CLIConfig {
    return this.config
  }

  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  validate(): ValidationResult {
    return ConfigValidator.validateCLIConfig(this.config)
  }

  getValidConfig(): CLIConfig {
    const validation = this.validate()
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }
    return this.config
  }

  // 转换为TransformConfig
  toTransformConfig(): TransformConfig {
    return {
      locale: this.config.locale,
      transformFormat: this.config.transformFormat,
      enableScript: this.config.enableScript,
      enableTemplate: this.config.enableTemplate,
      customMatcher: this.config.customMatcher,
      keyGenerator: this.config.keyGenerator,
      debug: this.config.debug
    }
  }

  // 转换为PluginConfig
  toPluginConfig(): PluginConfig {
    return {
      locale: this.config.locale,
      transformFormat: this.config.transformFormat,
      include: this.config.exts.map(ext => `**/*${ext}`),
      exclude: ['**/node_modules/**'],
      enableScript: this.config.enableScript,
      enableTemplate: this.config.enableTemplate,
      customMatcher: this.config.customMatcher,
      keyGenerator: this.config.keyGenerator,
      debug: this.config.debug
    }
  }
} 
