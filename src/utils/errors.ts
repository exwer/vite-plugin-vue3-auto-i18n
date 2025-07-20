import type { ErrorContext } from '../types'

export enum ErrorCode {
  // 配置错误
  INVALID_LOCALE = 'INVALID_LOCALE',
  MISSING_LOCALE = 'MISSING_LOCALE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_TRANSFORM_FORMAT = 'INVALID_TRANSFORM_FORMAT',
  
  // 语法错误
  TEMPLATE_SYNTAX_ERROR = 'TEMPLATE_SYNTAX_ERROR',
  SCRIPT_SYNTAX_ERROR = 'SCRIPT_SYNTAX_ERROR',
  
  // 运行时错误
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 系统错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class I18nCraftError extends Error {
  public readonly code: ErrorCode
  public readonly context?: ErrorContext
  public readonly timestamp: Date
  public readonly stack?: string

  constructor(
    code: ErrorCode,
    message: string,
    context?: ErrorContext
  ) {
    super(message)
    this.name = 'I18nCraftError'
    this.code = code
    this.context = context
    this.timestamp = new Date()
    
    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, I18nCraftError)
    }
  }

  /**
   * 获取格式化的错误信息
   */
  public getFormattedMessage(): string {
    let message = `[${this.code}] ${this.message}`
    
    if (this.context?.filePath) {
      message += `\nFile: ${this.context.filePath}`
    }
    
    if (this.context?.line && this.context?.column) {
      message += `\nLocation: ${this.context.line}:${this.context.column}`
    }
    
    if (this.context?.code) {
      message += `\nCode: ${this.context.code}`
    }
    
    return message
  }

  /**
   * 转换为JSON格式
   */
  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

/**
 * 创建错误实例的工厂函数
 */
export function createError(
  code: ErrorCode,
  message: string,
  context?: ErrorContext
): I18nCraftError {
  return new I18nCraftError(code, message, context)
}

/**
 * 错误代码到用户友好消息的映射
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_LOCALE]: 'Invalid locale configuration',
  [ErrorCode.MISSING_LOCALE]: 'Locale configuration is required',
  [ErrorCode.INVALID_CONFIG]: 'Invalid configuration',
  [ErrorCode.INVALID_TRANSFORM_FORMAT]: 'Invalid transform format',
  [ErrorCode.TEMPLATE_SYNTAX_ERROR]: 'Template syntax error',
  [ErrorCode.SCRIPT_SYNTAX_ERROR]: 'Script syntax error',
  [ErrorCode.TRANSFORM_ERROR]: 'Transformation error',
  [ErrorCode.PARSE_ERROR]: 'Parsing error',
  [ErrorCode.FILE_READ_ERROR]: 'File read error',
  [ErrorCode.FILE_WRITE_ERROR]: 'File write error',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.UNKNOWN_ERROR]: 'Unknown error occurred'
}

/**
 * 错误严重程度级别
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误严重程度映射
 */
export const ERROR_SEVERITY: Record<ErrorCode, ErrorSeverity> = {
  [ErrorCode.INVALID_LOCALE]: ErrorSeverity.HIGH,
  [ErrorCode.MISSING_LOCALE]: ErrorSeverity.CRITICAL,
  [ErrorCode.INVALID_CONFIG]: ErrorSeverity.HIGH,
  [ErrorCode.INVALID_TRANSFORM_FORMAT]: ErrorSeverity.MEDIUM,
  [ErrorCode.TEMPLATE_SYNTAX_ERROR]: ErrorSeverity.HIGH,
  [ErrorCode.SCRIPT_SYNTAX_ERROR]: ErrorSeverity.HIGH,
  [ErrorCode.TRANSFORM_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.PARSE_ERROR]: ErrorSeverity.HIGH,
  [ErrorCode.FILE_READ_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.FILE_WRITE_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.VALIDATION_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorCode.UNKNOWN_ERROR]: ErrorSeverity.CRITICAL
}

/**
 * 错误恢复建议
 */
export const ERROR_RECOVERY_SUGGESTIONS: Record<ErrorCode, string[]> = {
  [ErrorCode.INVALID_LOCALE]: [
    'Check your locale configuration structure',
    'Ensure all language keys are objects',
    'Verify locale file format'
  ],
  [ErrorCode.MISSING_LOCALE]: [
    'Add locale configuration to your config file',
    'Check if locale file exists and is readable'
  ],
  [ErrorCode.INVALID_CONFIG]: [
    'Review your configuration file',
    'Check required fields are present',
    'Validate configuration format'
  ],
  [ErrorCode.INVALID_TRANSFORM_FORMAT]: [
    'Check transform format function signatures',
    'Ensure all required format keys are provided',
    'Validate format function return types'
  ],
  [ErrorCode.TEMPLATE_SYNTAX_ERROR]: [
    'Check template syntax in Vue file',
    'Look for missing closing tags',
    'Validate template expressions'
  ],
  [ErrorCode.SCRIPT_SYNTAX_ERROR]: [
    'Check script syntax in Vue file',
    'Look for missing semicolons or brackets',
    'Validate JavaScript/TypeScript syntax'
  ],
  [ErrorCode.TRANSFORM_ERROR]: [
    'Check input file format',
    'Verify file encoding',
    'Try with a simpler file first'
  ],
  [ErrorCode.PARSE_ERROR]: [
    'Check file format and encoding',
    'Verify file is a valid Vue SFC',
    'Try parsing with Vue compiler directly'
  ],
  [ErrorCode.FILE_READ_ERROR]: [
    'Check file permissions',
    'Verify file exists',
    'Check disk space'
  ],
  [ErrorCode.FILE_WRITE_ERROR]: [
    'Check directory permissions',
    'Verify disk space',
    'Check if output directory exists'
  ],
  [ErrorCode.VALIDATION_ERROR]: [
    'Review validation rules',
    'Check input data format',
    'Verify required fields'
  ],
  [ErrorCode.UNKNOWN_ERROR]: [
    'Check system resources',
    'Try restarting the process',
    'Report issue with error details'
  ]
}

/**
 * 获取错误的恢复建议
 */
export function getRecoverySuggestions(error: I18nCraftError): string[] {
  return ERROR_RECOVERY_SUGGESTIONS[error.code] || ERROR_RECOVERY_SUGGESTIONS[ErrorCode.UNKNOWN_ERROR]
}

/**
 * 格式化错误信息，包含恢复建议
 */
export function formatErrorWithSuggestions(error: I18nCraftError): string {
  const suggestions = getRecoverySuggestions(error)
  let message = error.getFormattedMessage()
  
  if (suggestions.length > 0) {
    message += '\n\nRecovery suggestions:'
    suggestions.forEach((suggestion, index) => {
      message += `\n${index + 1}. ${suggestion}`
    })
  }
  
  return message
} 
