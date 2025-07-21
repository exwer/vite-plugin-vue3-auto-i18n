import type { CLIConfig } from './types'

/**
 * 默认转换格式
 */
export const DEFAULT_TRANSFORM_FORMAT = {
  template: (key: string) => `$t('${key}')`,
  script: (key: string) => `computed(() => $t('${key}'))`,
  interpolation: (key: string) => `$t('${key}')`
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): CLIConfig {
  return {
    scanDir: 'src',
    outDir: 'i18n_out',
    exts: ['.vue'],
    locale: {
      en: {
        message: {
          hello: 'Hello World',
          welcome: 'Welcome'
        }
      }
    },
    transformFormat: DEFAULT_TRANSFORM_FORMAT,
    enableScript: true,
    enableTemplate: true,
    debug: false
  }
} 
