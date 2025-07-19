// import type { Plugin } from 'vite'
// import templateTransformer from './plugins/template'
// import scriptTransformer from './plugins/script'
// import { getMatchedMsgPath } from './utils'
// import { parse as parseSFC } from '@vue/compiler-sfc'

export type { TransformOptions } from './core/transform'
export { transformSFC } from './core/transform'

// Vite 插件模式已废弃，推荐使用 CLI 工具
// export default function Vue3I18n(locale: any, options: any = {}): Plugin {
//   // ...原有 Vite 插件逻辑已注释
// }
