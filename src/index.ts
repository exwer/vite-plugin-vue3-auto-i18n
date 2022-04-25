import * as VueCompiler from '@vue/compiler-sfc'
import postHtml from 'posthtml'
import babel, { transformAsync } from '@babel/core'
import ScriptPlugin from './plugins/script'
import { isMatchLocaleMsg } from './utils'

export type LocaleMsg = Record<string, Record<string, Record<string, string>>>

export async function start(sourceCode: string, isMatchedStr: (target: string) => boolean) {
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
      const { html: templateOut } = await postHtml()
        .use((tree) => {
          tree.walk((node) => {
            return node
          })
        })
        .process(templateCode)
      result = result.replace(templateRegexp, templateOut)
    }
    if (scriptCode) {
      const scriptOut = await transformAsync(scriptCode, {
        plugins: [ScriptPlugin(babel, isMatchedStr)],
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
        const isMatchedStr = (target: string) => isMatchLocaleMsg(locale, target)
        const result = start(sourceCode, isMatchedStr)
        return {
          code: result,
        }
      }
    },
  }
}
