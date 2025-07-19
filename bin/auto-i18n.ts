#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import { transformSFC } from '../src/core/transform'

// 1. 查找并加载配置文件
const CONFIG_FILES = [
  'i18ncraft.config.js',
  'i18ncraft.config.cjs',
  'i18ncraft.config.mjs',
  'i18ncraft.config.json',
]

function findConfigFile() {
  const cwd = process.cwd()
  for (const file of CONFIG_FILES) {
    const fullPath = path.join(cwd, file)
    if (fs.existsSync(fullPath)) return fullPath
  }
  return null
}

function loadConfig(configPath: string) {
  if (configPath.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } else {
    // 支持 js/cjs/mjs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(configPath)
  }
}

function validateConfig(config: any) {
  if (!config.scanDir || typeof config.scanDir !== 'string') {
    throw new Error('i18ncraft: config.scanDir is required and must be a string')
  }
  if (!config.exts || !Array.isArray(config.exts) || config.exts.length === 0) {
    throw new Error('i18ncraft: config.exts is required and must be a non-empty array')
  }
  if (!config.exts.every((ext: string) => ext === '.vue')) {
    throw new Error('i18ncraft: currently only .vue files are supported in exts')
  }
  if (!config.outDir || typeof config.outDir !== 'string') {
    throw new Error('i18ncraft: config.outDir is required and must be a string')
  }
}

// 递归扫描目录下所有 .vue 文件
function scanVueFiles(dir: string, fileList: string[] = []) {
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

async function batchTransformVueFiles(config: any) {
  const { scanDir, outDir, locale, ...rest } = config
  const files = scanVueFiles(scanDir)
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

function main() {
  const configPath = findConfigFile()
  if (!configPath) {
    console.error('i18ncraft: No config file found. Please create i18ncraft.config.js in your project root.')
    process.exit(1)
  }
  let config
  try {
    config = loadConfig(configPath)
  } catch (e) {
    console.error('i18ncraft: Failed to load config file:', e)
    process.exit(1)
  }
  try {
    validateConfig(config)
  } catch (e) {
    console.error('i18ncraft: Invalid config:', e.message)
    process.exit(1)
  }
  console.log('i18ncraft: Loaded config:', config)
  // TODO: 调用核心转换逻辑
  batchTransformVueFiles(config)
}

main() 
