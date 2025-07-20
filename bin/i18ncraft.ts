#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import { transformSFC } from '../src/core/transform'
import type { CLIConfig, ValidationResult } from '../src/types'

// 1. 查找并加载配置文件
const CONFIG_FILES = [
  'i18ncraft.config.js',
  'i18ncraft.config.cjs',
  'i18ncraft.config.mjs',
  'i18ncraft.config.json',
]

function findConfigFile(): string | null {
  const cwd = process.cwd()
  for (const file of CONFIG_FILES) {
    const fullPath = path.join(cwd, file)
    if (fs.existsSync(fullPath)) return fullPath
  }
  return null
}

function loadConfig(configPath: string): CLIConfig {
  if (configPath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } else {
    // 支持 js/cjs/mjs
     
    return require(configPath)
  }
}

function validateConfig(config: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config.scanDir || typeof config.scanDir !== 'string') {
    errors.push('i18ncraft: config.scanDir is required and must be a string')
  }
  if (!config.exts || !Array.isArray(config.exts) || config.exts.length === 0) {
    errors.push('i18ncraft: config.exts is required and must be a non-empty array')
  }
  if (!config.exts.every((ext: string) => ext === '.vue')) {
    errors.push('i18ncraft: currently only .vue files are supported in exts')
  }
  if (!config.outDir || typeof config.outDir !== 'string') {
    errors.push('i18ncraft: config.outDir is required and must be a string')
  }
  
  // 验证 locale 配置
  if (!config.locale || typeof config.locale !== 'object' || Array.isArray(config.locale)) {
    errors.push('i18ncraft: config.locale is required and must be an object with language keys')
  }
  
  // 验证 locale 结构
  if (config.locale) {
    const localeKeys = Object.keys(config.locale)
    if (localeKeys.length === 0) {
      errors.push('i18ncraft: config.locale must contain at least one language')
    }
    
    // 验证每个语言的数据是对象
    for (const lang of localeKeys) {
      if (!config.locale[lang] || typeof config.locale[lang] !== 'object') {
        errors.push(`i18ncraft: config.locale.${lang} must be an object`)
      }
    }
  }
  
  // 验证 transformFormat（如果提供）
  if (config.transformFormat) {
    if (typeof config.transformFormat !== 'object') {
      errors.push('i18ncraft: config.transformFormat must be an object')
    } else {
      const requiredKeys = ['template', 'script', 'interpolation']
      for (const key of requiredKeys) {
        if (!config.transformFormat[key]) {
          errors.push(`i18ncraft: config.transformFormat.${key} is required`)
        } else {
          const format = config.transformFormat[key]
          if (typeof format !== 'string' && typeof format !== 'function') {
            errors.push(`i18ncraft: config.transformFormat.${key} must be a string or function`)
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// 递归扫描目录下所有 .vue 文件
function scanVueFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      scanVueFiles(fullPath, fileList)
    } else if (stat.isFile() && file.endsWith('.vue')) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

async function batchTransformVueFiles(config: CLIConfig): Promise<void> {
  const { scanDir, outDir, locale, ...rest } = config
  const files = scanVueFiles(scanDir)
  
  console.log(`[i18ncraft] Found ${files.length} .vue files to process`)
  
  for (const file of files) {
    const relPath = path.relative(scanDir, file)
    const outPath = path.join(outDir, relPath)
    const outDirPath = path.dirname(outPath)
    fs.mkdirSync(outDirPath, { recursive: true })
    const source = fs.readFileSync(file, 'utf-8')
    try {
      const result = await transformSFC(source, { locale, ...rest })
      fs.writeFileSync(outPath, result, 'utf-8')
      console.log(`[i18ncraft] transformed: ${file} -> ${outPath}`)
    } catch (e) {
      console.error(`[i18ncraft] error transforming ${file}:`, e)
    }
  }
}

function main(): void {
  const configPath = findConfigFile()
  if (!configPath) {
    console.error('i18ncraft: No config file found. Please create i18ncraft.config.js in your project root.')
    process.exit(1)
  }
  
  let config: CLIConfig
  try {
    config = loadConfig(configPath)
  } catch (e) {
    console.error('i18ncraft: Failed to load config file:', e)
    process.exit(1)
  }
  
  const validation = validateConfig(config)
  if (!validation.valid) {
    console.error('i18ncraft: Invalid config:')
    validation.errors.forEach(error => console.error(`  ${error}`))
    process.exit(1)
  }
  
  if (validation.warnings.length > 0) {
    console.warn('i18ncraft: Config warnings:')
    validation.warnings.forEach(warning => console.warn(`  ${warning}`))
  }
  
  console.log('i18ncraft: Loaded config:', config)
  batchTransformVueFiles(config)
}

main() 
