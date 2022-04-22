import * as VueCompiler from '@vue/compiler-sfc'
import postHtml from 'posthtml'
import { transformAsync } from '@babel/core'
import ScriptPlugin from './plugins/script'
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
        plugins: [ScriptPlugin],
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
async function debug() {
  const source
  = '<script>import {ref} from "vue";import {useI18n} from "vue-i18n"</script>'
  try {
    const result = await start(source)
    console.log(result)
  }
  catch (error) {
    console.log(error)
  }
}

debug()
