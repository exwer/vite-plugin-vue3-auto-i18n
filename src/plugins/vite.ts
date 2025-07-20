import type { Plugin } from 'vite'
import { createUnplugin } from './unplugin'
import type { UnpluginOptions } from './unplugin'

export function createVitePlugin(options: UnpluginOptions): Plugin {
  const unplugin = createUnplugin(options)
  
  // 获取unplugin的Vite适配器
  const vitePlugin = unplugin.vite(options)
  const plugin = Array.isArray(vitePlugin) ? vitePlugin[0] : vitePlugin
  
  // 返回带有必要方法的Vite插件
  return {
    ...plugin,
    name: 'i18ncraft',
    transform: unplugin.transform,
    configResolved: plugin.configResolved || (() => {})
  }
} 
