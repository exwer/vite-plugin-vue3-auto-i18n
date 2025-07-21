// 核心类型导出
export type { 
  TransformOptions, 
  LocaleConfig,
  LocaleObject,
  CLIConfig,
  TextMatch,
  TransformResult
} from './types'

// 核心转换功能
export { transformSFC } from './core/transform'

// 新的转换器架构
export { 
  BaseTransformer, 
  VueTransformer, 
  ReactTransformer,
  JavaScriptTransformer,
  createTransformer,
  transform
} from './core/transformer'

// Parser 系统
export { RecastParser } from './core/parsers'
export type { RecastParseOptions, RecastTransformOptions } from './core/parsers'

// Provider 系统
export type { I18nProvider } from './core/providers'
export { 
  ReactI18nextProvider,
  VueI18nProvider,
  VanillaI18nProvider,
  VanillaFunctionProvider,
  VanillaI18nextProvider,
  createVanillaProvider
} from './core/providers'

// 错误处理
export { 
  I18nCraftError, 
  ErrorCode, 
  createError
} from './core/errors'

// 文本匹配器
export { TextMatcher } from './core/matcher'

// React转换器
export { transformReact } from './plugins/react'

// 构建工具插件
export { createUnplugin } from './plugins/unplugin'
export { createVitePlugin } from './plugins/vite'
export { createWebpackPlugin } from './plugins/webpack'
