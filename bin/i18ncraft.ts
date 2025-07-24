#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import { createTransformer } from '../src/core/transformers'
import type { LocaleConfig } from '../src/types'

interface SimpleCLIConfig {
  scanDir: string
  outDir: string
  exts: string[]
  locale: LocaleConfig
}

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

async function loadConfig(configPath: string): Promise<SimpleCLIConfig> {
  if (configPath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } else {
    // 支持 js/cjs/mjs - 使用动态import
    try {
      // 清除缓存并动态导入
      const configUrl = `file://${path.resolve(configPath)}?t=${Date.now()}`
      const configModule = await import(configUrl)
      return configModule.default || configModule
    } catch (error) {
      // Fallback to require for CommonJS configs
      delete require.cache[require.resolve(configPath)]
      return require(configPath)
    }
  }
}

function validateConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config || typeof config !== 'object') {
    errors.push('i18ncraft: config must be an object')
    return { valid: false, errors }
  }

  if (!config.scanDir || typeof config.scanDir !== 'string') {
    errors.push('i18ncraft: config.scanDir is required and must be a string')
  }
  if (!config.exts || !Array.isArray(config.exts) || config.exts.length === 0) {
    errors.push('i18ncraft: config.exts is required and must be a non-empty array')
  }
  if (!config.outDir || typeof config.outDir !== 'string') {
    errors.push('i18ncraft: config.outDir is required and must be a string')
  }
  
  // 验证 locale 配置
  if (!config.locale || typeof config.locale !== 'object' || Array.isArray(config.locale)) {
    errors.push('i18ncraft: config.locale is required and must be an object with language keys')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 递归扫描目录下的支持文件
function scanFiles(dir: string, exts: string[], fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      scanFiles(fullPath, exts, fileList)
    } else if (stat.isFile() && exts.some(ext => file.endsWith(ext))) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

async function batchTransformFiles(config: SimpleCLIConfig): Promise<void> {
  const { scanDir, outDir, exts, locale } = config
  const files = scanFiles(scanDir, exts)
  
  console.log(`[i18ncraft] Found ${files.length} files to process`)
  
  for (const file of files) {
    const relPath = path.relative(scanDir, file)
    const outPath = path.join(outDir, relPath)
    const outDirPath = path.dirname(outPath)
    fs.mkdirSync(outDirPath, { recursive: true })
    
    const source = fs.readFileSync(file, 'utf-8')
    try {
      const transformer = createTransformer(source, { locale })
      const result = await transformer.transform()
      fs.writeFileSync(outPath, result.code, 'utf-8')
      console.log(`[i18ncraft] transformed: ${file} -> ${outPath} (${result.matches.length} matches)`)
    } catch (e) {
      console.error(`[i18ncraft] error transforming ${file}:`, e)
    }
  }
}

async function main(): Promise<void> {
  const configPath = findConfigFile()
  if (!configPath) {
    console.error('i18ncraft: No config file found. Please create i18ncraft.config.js in your project root.')
    process.exit(1)
  }
  
  let config: SimpleCLIConfig
  try {
    config = await loadConfig(configPath)
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
  
  console.log('i18ncraft: Starting transformation...')
  await batchTransformFiles(config)
}

main() 
