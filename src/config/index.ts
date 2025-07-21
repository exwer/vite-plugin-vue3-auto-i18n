export * from './validator'
export * from './defaults'
export * from './types'

import { validateConfig } from './validator'
import { getDefaultConfig } from './defaults'
import type { CLIConfig, ValidationResult } from './types'

// 重新导出函数
export { validateConfig, getDefaultConfig }

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: CLIConfig

  constructor(config?: Partial<CLIConfig>) {
    this.config = { ...getDefaultConfig(), ...config }
  }

  /**
   * 获取配置
   */
  getConfig(): CLIConfig {
    return this.config
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * 验证配置
   */
  validate(): ValidationResult {
    return validateConfig(this.config)
  }

  /**
   * 获取有效配置（如果无效则抛出错误）
   */
  getValidConfig(): CLIConfig {
    const validation = this.validate()
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }
    return this.config
  }
} 
