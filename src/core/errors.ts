// 错误代码枚举
export enum ErrorCode {
  // 配置错误
  MISSING_LOCALE = 'MISSING_LOCALE',
  INVALID_LOCALE = 'INVALID_LOCALE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // 解析错误
  PARSE_ERROR = 'PARSE_ERROR',
  TEMPLATE_SYNTAX_ERROR = 'TEMPLATE_SYNTAX_ERROR',
  SCRIPT_SYNTAX_ERROR = 'SCRIPT_SYNTAX_ERROR',
  
  // 文件错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  
  // 转换错误
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  
  // 中间件错误
  MIDDLEWARE_ERROR = 'MIDDLEWARE_ERROR',
  
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误上下文
export interface ErrorContext {
  filePath?: string
  line?: number
  column?: number
  code?: string
  originalError?: Error
  [key: string]: any
}

// 统一错误类
export class I18nCraftError extends Error {
  public readonly code: ErrorCode
  public readonly context: ErrorContext

  constructor(code: ErrorCode, message: string, context: ErrorContext = {}) {
    super(message)
    this.name = 'I18nCraftError'
    this.code = code
    this.context = context
  }

  // 格式化错误信息
  format(): string {
    let formatted = `[${this.code}] ${this.message}`
    
    if (this.context.filePath) {
      formatted += `\nFile: ${this.context.filePath}`
    }
    
    if (this.context.line) {
      formatted += `\nLine: ${this.context.line}`
      if (this.context.column) {
        formatted += `:${this.context.column}`
      }
    }
    
    if (this.context.originalError) {
      formatted += `\nOriginal Error: ${this.context.originalError.message}`
    }
    
    return formatted
  }

  // 获取错误建议
  getSuggestions(): string[] {
    const suggestions: string[] = []
    
    switch (this.code) {
      case ErrorCode.MISSING_LOCALE:
        suggestions.push('Please provide a locale configuration in your config file')
        suggestions.push('Example: { locale: { en: { message: { hello: "Hello" } } } }')
        break
        
      case ErrorCode.INVALID_LOCALE:
        suggestions.push('Locale must be an object with language keys')
        suggestions.push('Example: { en: { message: { hello: "Hello" } }, zh: { message: { hello: "你好" } } }')
        break
        
      case ErrorCode.TEMPLATE_SYNTAX_ERROR:
        suggestions.push('Check your Vue template syntax')
        suggestions.push('Make sure all tags are properly closed')
        suggestions.push('Verify that template expressions are valid')
        break
        
      case ErrorCode.SCRIPT_SYNTAX_ERROR:
        suggestions.push('Check your JavaScript/TypeScript syntax')
        suggestions.push('Verify that all imports and exports are correct')
        suggestions.push('Make sure all functions and variables are properly declared')
        break
        
      case ErrorCode.FILE_NOT_FOUND:
        suggestions.push('Check if the file path is correct')
        suggestions.push('Make sure the file exists in the specified location')
        break
        
      case ErrorCode.DIRECTORY_NOT_FOUND:
        suggestions.push('Check if the directory path is correct')
        suggestions.push('Make sure the directory exists')
        suggestions.push('Verify that you have read permissions for the directory')
        break
        
      case ErrorCode.FILE_WRITE_ERROR:
        suggestions.push('Check if you have write permissions for the output directory')
        suggestions.push('Make sure the output directory exists')
        suggestions.push('Verify that there is enough disk space')
        break
    }
    
    return suggestions
  }
}

// 错误创建函数
export function createError(code: ErrorCode, message: string, context: ErrorContext = {}): I18nCraftError {
  return new I18nCraftError(code, message, context)
}

// 错误格式化函数
export function formatErrorWithSuggestions(error: I18nCraftError): string {
  let formatted = error.format()
  const suggestions = error.getSuggestions()
  
  if (suggestions.length > 0) {
    formatted += '\n\nSuggestions:'
    suggestions.forEach((suggestion, index) => {
      formatted += `\n${index + 1}. ${suggestion}`
    })
  }
  
  return formatted
}

// 错误处理工具类
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: Array<(error: I18nCraftError) => void> = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // 添加错误监听器
  addErrorListener(listener: (error: I18nCraftError) => void): void {
    this.errorListeners.push(listener)
  }

  // 移除错误监听器
  removeErrorListener(listener: (error: I18nCraftError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  // 处理错误
  handleError(error: I18nCraftError): void {
    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })

    // 默认错误处理
    if (error.context.debug) {
      console.error(formatErrorWithSuggestions(error))
    } else {
      console.error(error.format())
    }
  }

  // 安全执行函数
  async safeExecute<T>(
    fn: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (error) {
      const i18nError = error instanceof I18nCraftError 
        ? error 
        : createError(ErrorCode.UNKNOWN_ERROR, String(error), { ...context, originalError: error as Error })
      
      this.handleError(i18nError)
      return null
    }
  }

  // 安全文件操作
  async safeFileOperation<T>(
    operation: () => Promise<T>,
    filePath: string,
    context: ErrorContext = {}
  ): Promise<T | null> {
    return this.safeExecute(operation, { ...context, filePath })
  }
}

// 便捷函数
export const errorHandler = ErrorHandler.getInstance()

// 文件路径验证
export function validateFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false
  }
  
  // 检查路径是否包含非法字符
  const illegalChars = /[<>:"|?*]/
  if (illegalChars.test(filePath)) {
    return false
  }
  
  return true
}

// 目录路径验证
export function validateDirectoryPath(dirPath: string): boolean {
  if (!dirPath || typeof dirPath !== 'string') {
    return false
  }
  
  // 检查路径是否包含非法字符
  const illegalChars = /[<>:"|?*]/
  if (illegalChars.test(dirPath)) {
    return false
  }
  
  return true
} 
