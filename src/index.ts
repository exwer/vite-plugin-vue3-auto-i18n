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
  ErrorContext
} from './types'

export { transformSFC, DEFAULT_TRANSFORM_FORMAT, matchOrGenerateKey } from './core/transform'
export { getMatchedMsgPath, formatKey } from './utils'
export { I18nCraftError, ErrorCode, createError, formatErrorWithSuggestions } from './utils/errors'
export { ErrorHandler, safeFileOperation, validateFilePath, validateDirectoryPath } from './utils/error-handler'
