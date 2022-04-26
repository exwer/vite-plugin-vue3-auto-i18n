import * as VueCompiler from '@vue/compiler-sfc'
import babel, { transformAsync } from '@babel/core'
import ScriptPlugin from './plugins/script'
import templateTransformer from './plugins/template'
import { getMatchedMsgPath } from './utils'

type Language = string
export type LocaleMsg = Record<Language, Record<string, string | Record<any, any>>>

export async function start(sourceCode: string, isMatchedStr: (target: string) => false | string) {
  let result = sourceCode
  // 匹配模板内容
  const templateRegexp = /(?<=^<template>)([\s\S]*)(?=<\/template>)/g

  // 匹配script内容
  const scriptRegexp = /(?<=(<script).*?>)([\s\S]*)(?=<\/script>)/g
  try {
    const descriptor = VueCompiler.parse(sourceCode).descriptor
    const scriptCode
      = descriptor.scriptSetup?.content ?? descriptor.script?.content
    const templateCode = descriptor.template?.content
    if (templateCode) {
      const templateOut = await templateTransformer(templateCode, isMatchedStr)
      result = result.replace(templateRegexp, templateOut)
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
export default function Vue3I18n(locale: LocaleMsg) {
  return {
    name: 'vite-plugin-vue3-i18n',
    async transform(sourceCode: string, id: string) {
      if (id.endsWith('.vue')) {
        const isMatchedStr = (target: string) => getMatchedMsgPath(locale, target)
        const result = await start(sourceCode, isMatchedStr)
        return {
          code: result,
        }
      }
    },
  }
}
