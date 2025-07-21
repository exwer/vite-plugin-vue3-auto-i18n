import path from 'path'
import fs from 'fs'
import { ConfigManager } from '../config'
import { transformSFC } from '../core/transform'
import { globalMiddlewareManager } from '../core/middleware'
import { getBuiltinMiddlewares } from '../core/middleware/builtin'
import type { CLIConfig } from '../config/types'

/**
 * 新的CLI工具类
 */
export class I18nCraftCLI {
  private configManager: ConfigManager
  private initialized = false

  constructor(config?: Partial<CLIConfig>) {
    this.configManager = new ConfigManager(config)
  }

  /**
   * 初始化CLI
   */
  async init(): Promise<void> {
    if (this.initialized) return

    // 注册内置中间件
    const builtinMiddlewares = getBuiltinMiddlewares()
    builtinMiddlewares.forEach((middleware: any) => {
      globalMiddlewareManager.register(middleware)
    })

    this.initialized = true
  }

  /**
   * 扫描文件
   */
  scanFiles(scanDir: string, exts: string[]): string[] {
    const files: string[] = []
    
    function scanDirectory(dir: string): void {
      if (!fs.existsSync(dir)) return
      
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath)
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath)
          if (exts.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }
    
    scanDirectory(scanDir)
    return files
  }

  /**
   * 转换单个文件
   */
  async transformFile(filePath: string, config: CLIConfig): Promise<{
    success: boolean
    outputPath?: string
    error?: string
    stats?: {
      transformedStrings: number
      processingTime: number
    }
  }> {
    const startTime = Date.now()
    
    try {
      const source = fs.readFileSync(filePath, 'utf-8')
      const result = await transformSFC(source, {
        locale: config.locale,
        enableScript: config.enableScript,
        enableTemplate: config.enableTemplate,
        customMatcher: config.customMatcher,
        keyGenerator: config.keyGenerator,
        debug: config.debug,
        transformFormat: config.transformFormat
      })

      // 计算输出路径
      const relPath = path.relative(config.scanDir, filePath)
      const outputPath = path.join(config.outDir, relPath)
      const outputDir = path.dirname(outputPath)
      
      // 确保输出目录存在
      fs.mkdirSync(outputDir, { recursive: true })
      
      // 写入文件
      fs.writeFileSync(outputPath, result, 'utf-8')
      
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        outputPath,
        stats: {
          transformedStrings: 0, // 这里可以从result中获取
          processingTime
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 批量转换文件
   */
  async batchTransform(config?: Partial<CLIConfig>): Promise<{
    totalFiles: number
    successfulFiles: number
    failedFiles: number
    totalTime: number
    errors: string[]
  }> {
    await this.init()
    
    if (config) {
      this.configManager.updateConfig(config)
    }
    
    const finalConfig = this.configManager.getValidConfig()
    const files = this.scanFiles(finalConfig.scanDir, finalConfig.exts)
    
    console.log(`[i18ncraft] Found ${files.length} files to process`)
    
    const startTime = Date.now()
    let successfulFiles = 0
    let failedFiles = 0
    const errors: string[] = []
    
    for (const file of files) {
      const result = await this.transformFile(file, finalConfig)
      
      if (result.success) {
        successfulFiles++
        console.log(`[i18ncraft] ✓ ${file} -> ${result.outputPath}`)
      } else {
        failedFiles++
        errors.push(`${file}: ${result.error}`)
        console.error(`[i18ncraft] ✗ ${file}: ${result.error}`)
      }
    }
    
    const totalTime = Date.now() - startTime
    
    console.log(`[i18ncraft] Batch transformation completed`)
    console.log(`[i18ncraft] Total: ${files.length}, Success: ${successfulFiles}, Failed: ${failedFiles}`)
    console.log(`[i18ncraft] Total time: ${totalTime}ms`)
    
    return {
      totalFiles: files.length,
      successfulFiles,
      failedFiles,
      totalTime,
      errors
    }
  }

  /**
   * 获取配置
   */
  getConfig(): CLIConfig {
    return this.configManager.getConfig()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CLIConfig>): void {
    this.configManager.updateConfig(config)
  }

  /**
   * 验证配置
   */
  validateConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
    return this.configManager.validate()
  }
} 
