export enum ErrorCode {
  // 配置错误
  INVALID_LOCALE = 'INVALID_LOCALE',
  MISSING_LOCALE = 'MISSING_LOCALE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // 语法错误
  TEMPLATE_SYNTAX_ERROR = 'TEMPLATE_SYNTAX_ERROR',
  SCRIPT_SYNTAX_ERROR = 'SCRIPT_SYNTAX_ERROR',
  
  // 运行时错误
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

export class I18nCraftError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'I18nCraftError'
  }
}

export function createError(code: ErrorCode, message: string, details?: any): I18nCraftError {
  return new I18nCraftError(message, code, details)
} 
