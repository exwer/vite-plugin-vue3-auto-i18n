// 核心类型导出
export type { 
  TransformOptions, 
  TransformFormat,
  LocaleConfig,
  LocaleObject,
  CLIConfig,
  ValidationResult,
  FileProcessResult,
  BatchProcessResult,
  MatchResult,
  ErrorContext,
  PluginOptions,
  TextMatch,
  TransformResult
} from './types'

// 核心转换功能
export { transformSFC, DEFAULT_TRANSFORM_FORMAT, matchOrGenerateKey } from './core/transform'

// 新的转换器架构
export { 
  BaseTransformer, 
  VueTransformer, 
  ReactTransformer,
  createTransformer,
  transform
} from './core/transformer'

// 统一配置管理
export { 
  UnifiedConfigManager,
  ConfigValidator,
  DEFAULT_CONFIG
} from './config/unified'

// 统一错误处理
export { 
  I18nCraftError, 
  ErrorCode, 
  createError, 
  formatErrorWithSuggestions,
  ErrorHandler,
  errorHandler
} from './core/errors'

// 文本匹配器
export { TextMatcher } from './core/matcher'

// 中间件系统
export {
  MiddlewareManager,
  globalMiddlewareManager,
  useMiddleware,
  removeMiddleware
} from './core/middleware'

export type { TransformMiddleware } from './core/middleware'

export {
  performanceMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  formattingMiddleware,
  statisticsMiddleware,
  cacheMiddleware,
  getBuiltinMiddlewares
} from './core/middleware/builtin'

// CLI工具
export { I18nCraftCLI } from './cli'

// React转换器
export { transformReact } from './plugins/react'

// 构建工具插件
export { createUnplugin } from './plugins/unplugin'
export { createVitePlugin } from './plugins/vite'
export { createWebpackPlugin, I18nCraftWebpackPlugin } from './plugins/webpack'

// 工具函数
export { getMatchedMsgPath, formatKey } from './utils'

// 文件操作工具
export { validateFilePath, validateDirectoryPath } from './core/errors'
