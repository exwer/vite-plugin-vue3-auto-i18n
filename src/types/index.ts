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

// 导出所有类型
export * from '../core/errors' 
