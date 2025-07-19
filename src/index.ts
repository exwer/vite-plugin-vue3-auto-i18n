import * as VueCompiler from '@vue/compiler-sfc'
import babel, { transformAsync } from '@babel/core'
import ScriptPlugin from './plugins/script'
import templateTransformer from './plugins/template'
import { getMatchedMsgPath } from './utils'

type Language = string
export type LocaleMsg = Record<Language, Record<string, string | Record<any, any>>>

export interface AutoI18nOptions {
  enableScript?: boolean
  enableTemplate?: boolean
  exclude?: (string | RegExp)[]
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
  debug?: boolean
}

export async function start(sourceCode: string, isMatchedStr: (target: string) => false | string) {
  let result = sourceCode
  // 匹配模板内容
  const templateRegexp = /(?<=<template>)([\s\S]*)(?=<\/template>)/g

  // 匹配script内容
  const scriptRegexp = /(?<=(<script).*?>)([\s\S]*)(?=<\/script>)/g
  try {
    const descriptor = VueCompiler.parse(sourceCode).descriptor
    const scriptCode
      = descriptor.scriptSetup?.content ?? descriptor.script?.content
    const templateCode = descriptor.template?.content
    if (templateCode) {
      try {
        const templateOut = await templateTransformer(templateCode, isMatchedStr)
        result = result.replace(templateRegexp, templateOut)
      } catch (e: any) {
        throw new Error('[auto-i18n] template parse error: ' + (e && e.message ? e.message : e))
      }
    }
    if (scriptCode) {
      const scriptOut = await transformAsync(scriptCode, {
        plugins: [[ScriptPlugin, { babel, isMatchedStr }]],
      })
      if (scriptOut?.code)
        result = result.replace(scriptRegexp, scriptOut.code)
    }
  }
  catch (error) {
    if (error instanceof Error)
      throw new Error(error.message)
    else if (typeof error === 'string')
      throw new Error(error)
  }
  return result
}
export default function Vue3I18n(locale: LocaleMsg, options: AutoI18nOptions = {}) {
  const {
    enableScript = true,
    enableTemplate = true,
    exclude = [],
    customMatcher,
    keyGenerator,
    debug = false,
  } = options

  // 验证配置
  if (!locale || typeof locale !== 'object' || Object.keys(locale).length === 0) {
    throw new Error('[auto-i18n] invalid locale configuration: locale must be a non-empty object')
  }

  function isExcluded(id: string) {
    return exclude.some(pattern =>
      typeof pattern === 'string' ? id.includes(pattern) : pattern.test(id)
    )
  }

  function matchOrGenerateKey(text: string) {
    if (customMatcher) {
      const res = customMatcher(text)
      if (res) return res
    }
    const matched = getMatchedMsgPath(locale, text)
    if (matched) return matched
    if (keyGenerator) return keyGenerator(text)
    return false
  }

  return {
    name: 'vite-plugin-vue3-i18n',
    async transform(sourceCode: string, id: string) {
      if (!id.endsWith('.vue') || isExcluded(id)) return
      
      const isMatchedStr = matchOrGenerateKey
      let result = sourceCode
      let hasTemplate = false
      let hasScript = false
      
      try {
        const descriptor = VueCompiler.parse(sourceCode).descriptor
        const scriptCode = descriptor.scriptSetup?.content ?? descriptor.script?.content
        const templateCode = descriptor.template?.content
        
        // 模板转换
        if (enableTemplate && templateCode) {
          hasTemplate = true
          try {
            const templateOut = await templateTransformer(templateCode, isMatchedStr)
            result = result.replace(/(?<=<template>)([\s\S]*)(?=<\/template>)/g, templateOut)
          } catch (e: any) {
            const errorMsg = e?.message || String(e)
            throw new Error(`[auto-i18n] template parse error in ${id}: ${errorMsg}`)
          }
        }
        
        // 脚本转换
        if (enableScript && scriptCode) {
          hasScript = true
          try {
            const scriptOut = await transformAsync(scriptCode, {
              plugins: [[ScriptPlugin, { babel, isMatchedStr }]],
            })
            if (scriptOut?.code)
              result = result.replace(/(?<=(<script).*?>)([\s\S]*)(?=<\/script>)/g, scriptOut.code)
          } catch (e: any) {
            const errorMsg = e?.message || String(e)
            throw new Error(`[auto-i18n] script parse error in ${id}: ${errorMsg}`)
          }
        }
        
        // 警告信息
        if (!hasTemplate && enableTemplate) {
          console.warn(`[auto-i18n] warning: No template found in ${id}`)
        }
        if (!hasScript && enableScript) {
          console.warn(`[auto-i18n] warning: No script found in ${id}`)
        }
        
      } catch (error) {
        if (error instanceof Error) {
          throw error
        } else if (typeof error === 'string') {
          throw new Error(`[auto-i18n] unknown error in ${id}: ${error}`)
        } else {
          throw new Error(`[auto-i18n] unknown error in ${id}`)
        }
      }
      
      if (debug) {
        console.log(`[auto-i18n] transformed: ${id}`)
      }
      
      return { code: result }
    },
  }
}
