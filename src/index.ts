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
      try {
        const descriptor = VueCompiler.parse(sourceCode).descriptor
        const scriptCode = descriptor.scriptSetup?.content ?? descriptor.script?.content
        const templateCode = descriptor.template?.content
        // 模板转换
        if (enableTemplate && templateCode) {
          try {
            const templateOut = await templateTransformer(templateCode, isMatchedStr)
            result = result.replace(/(?<=<template>)([\s\S]*)(?=<\/template>)/g, templateOut)
          } catch (e: any) {
            throw new Error('[auto-i18n] template parse error: ' + (e && e.message ? e.message : e))
          }
        }
        // 脚本转换
        if (enableScript && scriptCode) {
          const scriptOut = await transformAsync(scriptCode, {
            plugins: [[ScriptPlugin, { babel, isMatchedStr }]],
          })
          if (scriptOut?.code)
            result = result.replace(/(?<=(<script).*?>)([\s\S]*)(?=<\/script>)/g, scriptOut.code)
        }
      } catch (error) {
        if (error instanceof Error)
          throw new Error(error.message)
        else if (typeof error === 'string')
          throw new Error(error)
      }
      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[auto-i18n] transformed:', id)
      }
      return { code: result }
    },
  }
}
