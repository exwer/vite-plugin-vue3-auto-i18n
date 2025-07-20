import type { ErrorContext, FileProcessResult, BatchProcessResult } from '../types'
import { I18nCraftError, ErrorCode, formatErrorWithSuggestions } from './errors'

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  verbose?: boolean
  continueOnError?: boolean
  logToFile?: boolean
  logFilePath?: string
}

/**
 * 全局错误处理器
 */
export class ErrorHandler {
  private errors: I18nCraftError[] = []
  private warnings: string[] = []
  private options: ErrorHandlerOptions

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      verbose: false,
      continueOnError: true,
      logToFile: false,
      logFilePath: 'i18ncraft-errors.log',
      ...options
    }
  }

  /**
   * 处理错误
   */
  public handleError(error: Error | I18nCraftError, context?: ErrorContext): void {
    const i18nError = this.normalizeError(error, context)
    this.errors.push(i18nError)

    if (this.options.verbose) {
      console.error(formatErrorWithSuggestions(i18nError))
    } else {
      console.error(`[${i18nError.code}] ${i18nError.message}`)
    }

    if (!this.options.continueOnError) {
      throw i18nError
    }
  }

  /**
   * 添加警告
   */
  public addWarning(message: string, context?: ErrorContext): void {
    const warning = context?.filePath 
      ? `${message} (${context.filePath})`
      : message
    this.warnings.push(warning)
    
    if (this.options.verbose) {
      console.warn(`[WARNING] ${warning}`)
    }
  }

  /**
   * 获取所有错误
   */
  public getErrors(): I18nCraftError[] {
    return [...this.errors]
  }

  /**
   * 获取所有警告
   */
  public getWarnings(): string[] {
    return [...this.warnings]
  }

  /**
   * 检查是否有错误
   */
  public hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 检查是否有警告
   */
  public hasWarnings(): boolean {
    return this.warnings.length > 0
  }

  /**
   * 清空错误和警告
   */
  public clear(): void {
    this.errors = []
    this.warnings = []
  }

  /**
   * 生成错误报告
   */
  public generateReport(): string {
    let report = `# i18ncraft Error Report\n`
    report += `Generated: ${new Date().toISOString()}\n\n`

    if (this.errors.length > 0) {
      report += `## Errors (${this.errors.length})\n\n`
      this.errors.forEach((error, index) => {
        report += `### Error ${index + 1}\n`
        report += `- Code: ${error.code}\n`
        report += `- Message: ${error.message}\n`
        if (error.context?.filePath) {
          report += `- File: ${error.context.filePath}\n`
        }
        if (error.context?.line && error.context?.column) {
          report += `- Location: ${error.context.line}:${error.context.column}\n`
        }
        report += `- Timestamp: ${error.timestamp.toISOString()}\n\n`
      })
    }

    if (this.warnings.length > 0) {
      report += `## Warnings (${this.warnings.length})\n\n`
      this.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`
      })
    }

    return report
  }

  /**
   * 保存错误报告到文件
   */
  public async saveReport(filePath?: string): Promise<void> {
    if (!this.options.logToFile && !filePath) {
      return
    }

    const targetPath = filePath || this.options.logFilePath
    if (!targetPath) {
      return
    }

    try {
      const fs = await import('fs/promises')
      const report = this.generateReport()
      await fs.writeFile(targetPath, report, 'utf-8')
    } catch (error) {
      console.error('Failed to save error report:', error)
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: Error | I18nCraftError, context?: ErrorContext): I18nCraftError {
    if (error instanceof I18nCraftError) {
      if (context) {
        // 创建新的错误实例，合并上下文信息
        return new I18nCraftError(
          error.code,
          error.message,
          { ...error.context, ...context }
        )
      }
      return error
    }

    // 将普通Error转换为I18nCraftError
    return new I18nCraftError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      { ...context, originalError: error }
    )
  }
}

/**
 * 创建文件处理结果
 */
export function createFileProcessResult(
  filePath: string,
  success: boolean,
  error?: string,
  stats?: FileProcessResult['stats']
): FileProcessResult {
  return {
    success,
    filePath,
    error,
    stats
  }
}

/**
 * 创建批量处理结果
 */
export function createBatchProcessResult(
  results: FileProcessResult[],
  totalTime: number
): BatchProcessResult {
  const successfulFiles = results.filter(r => r.success).length
  const failedFiles = results.filter(r => !r.success).length

  return {
    totalFiles: results.length,
    successfulFiles,
    failedFiles,
    results,
    totalTime
  }
}

/**
 * 安全的文件操作包装器
 */
export async function safeFileOperation<T>(
  operation: () => Promise<T>,
  filePath: string,
  errorCode: ErrorCode = ErrorCode.FILE_READ_ERROR
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new I18nCraftError(
      errorCode,
      `Failed to perform file operation: ${error instanceof Error ? error.message : String(error)}`,
      { filePath, originalError: error }
    )
  }
}

/**
 * 验证文件路径
 */
export function validateFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false
  }
  
  // 检查路径是否包含非法字符
  const invalidChars = /[<>:"|?*]/
  if (invalidChars.test(filePath)) {
    return false
  }
  
  return true
}

/**
 * 验证目录路径
 */
export function validateDirectoryPath(dirPath: string): boolean {
  if (!validateFilePath(dirPath)) {
    return false
  }
  
  // 检查是否是绝对路径或相对路径
  if (!dirPath.startsWith('.') && !dirPath.startsWith('/') && !dirPath.match(/^[A-Z]:/)) {
    return false
  }
  
  return true
} 
