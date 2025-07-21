import { I18nProvider } from '../core/providers/base'

// 基础类型定义
export interface LocaleObject {
  [key: string]: string | LocaleObject
}

export interface LocaleConfig {
  [language: string]: LocaleObject
}

// 转换选项类型
export interface TransformOptions {
  locale: LocaleConfig
  provider?: I18nProvider
}

// CLI 配置类型
export interface CLIConfig {
  scanDir: string
  outDir: string
  exts: string[]
  locale: LocaleConfig
}

// 匹配结果类型
export type MatchResult = string | false

// 文本匹配类型
export interface TextMatch {
  original: string
  key: string
  type: string
  line?: number
  column?: number
}

// 转换结果类型
export interface TransformResult {
  code: string
  matches: TextMatch[]
  errors: Error[]
}

// 插件选项类型
export interface PluginOptions {
  locale: LocaleConfig
}

// 文件处理结果类型
export interface FileProcessResult {
  success: boolean
  filePath: string
  outputPath?: string
  error?: string
  stats?: {
    transformedStrings: number
    processingTime: number
  }
}

// 批量处理结果类型
export interface BatchProcessResult {
  totalFiles: number
  successfulFiles: number
  failedFiles: number
  results: FileProcessResult[]
  totalTime: number
}

// AST 节点类型（用于 recast）
export interface ASTNode {
  type: string
  [key: string]: any
}

// 路径类型（用于 recast）
export interface ASTPath {
  node: ASTNode
  parent: ASTPath | null
  [key: string]: any
}

// 错误类型增强
export interface ErrorContext {
  filePath?: string
  line?: number
  column?: number
  code?: string
  [key: string]: any
}

// 验证结果类型
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 性能指标类型
export interface PerformanceMetrics {
  parseTime: number
  transformTime: number
  totalTime: number
  memoryUsage: number
}

// 导出所有类型
export * from '../core/errors' 
