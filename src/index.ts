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

export { transformSFC, DEFAULT_TRANSFORM_FORMAT, matchOrGenerateKey } from './core/transform'
export { transformReact } from './plugins/react'
export { createUnplugin } from './plugins/unplugin'
export { createVitePlugin } from './plugins/vite'
export { createWebpackPlugin, I18nCraftWebpackPlugin } from './plugins/webpack'
export { getMatchedMsgPath, formatKey } from './utils'
export { I18nCraftError, ErrorCode, createError, formatErrorWithSuggestions } from './utils/errors'
export { ErrorHandler, safeFileOperation, validateFilePath, validateDirectoryPath } from './utils/error-handler'
