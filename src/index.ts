import * as VueCompiler from '@vue/compiler-sfc'
import { transformSync } from '@swc/core'
import postHtml from 'posthtml'
import { ScriptPlugin } from './plugins/script'
export async function start(sourceCode: string) {
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
      /*
        replace matched pure node content with {{ $t('xxx') }}
      */
      const { html: templateOut } = await postHtml().use((tree) => {
        tree.walk((node) => {
          return node
        })
      }).process(templateCode)
      result = result.replace(templateRegexp, templateOut)
    }
    if (scriptCode) {
      const scriptOut = transformSync(scriptCode, {
        plugin: ScriptPlugin,
      })
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

export default function Vue3I18n() {
  return {
    name: 'vite-plugin-vue3-i18n',
    async transform(sourceCode: string, id: string) {
      if (id.endsWith('.vue')) {
        const result = start(sourceCode)
        return {
          code: result,
        }
      }
    },
  }
}
