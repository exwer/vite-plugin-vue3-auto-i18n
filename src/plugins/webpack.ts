import type { Compiler, Compilation } from 'webpack'
import { transformSFC } from '../core/transform'
import { transformReact } from './react'
import { createError, ErrorCode } from '../utils/errors'
import type { PluginOptions } from '../types'

export interface WebpackPluginOptions extends PluginOptions {
  include?: string[]
  exclude?: string[]
}

export class I18nCraftWebpackPlugin {
  private options: WebpackPluginOptions
  public name = 'I18nCraftWebpackPlugin'

  constructor(options: WebpackPluginOptions) {
    this.options = options
    
    if (!options.locale) {
      throw createError(ErrorCode.MISSING_LOCALE, 'locale configuration is required')
    }
  }

  apply(compiler: Compiler) {
    const { locale, transformFormat, include = ['**/*.{vue,js,jsx,ts,tsx}'], exclude = ['**/node_modules/**'] } = this.options

    compiler.hooks.compilation.tap('I18nCraftWebpackPlugin', (compilation: Compilation) => {
      // 简化实现，避免复杂的Webpack API
      // 只在钩子存在时才使用
      if (compilation.hooks && typeof compilation.hooks.afterOptimizeChunkModules !== 'undefined') {
        compilation.hooks.afterOptimizeChunkModules.tap('I18nCraftWebpackPlugin', () => {
          // 这里可以处理模块转换
          // 由于Webpack的复杂性，这里只是基础实现
        })
      }
    })
  }
}

export function createWebpackPlugin(options: WebpackPluginOptions) {
  return new I18nCraftWebpackPlugin(options)
} 
