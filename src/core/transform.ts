import { parse as parseSFC } from '@vue/compiler-sfc'
import templateTransformer from '../plugins/template'
import scriptTransformer from '../plugins/script'
import { getMatchedMsgPath } from '../utils'

export interface TransformOptions {
  locale: any
  enableScript?: boolean
  enableTemplate?: boolean
  customMatcher?: (text: string) => string | false
  keyGenerator?: (text: string) => string
  debug?: boolean
}

export function matchOrGenerateKey(
  locale: any,
  customMatcher: TransformOptions['customMatcher'],
  keyGenerator: TransformOptions['keyGenerator'],
  text: string
) {
  if (customMatcher) {
    const res = customMatcher(text)
    if (res) return res
  }
  const matched = getMatchedMsgPath(locale, text)
  if (matched) return matched
  if (keyGenerator) return keyGenerator(text)
  return false
}

export async function transformSFC(
  sourceCode: string,
  options: TransformOptions
): Promise<string> {
  const { locale, enableScript = true, enableTemplate = true, customMatcher, keyGenerator, debug } = options
  if (!locale || typeof locale !== 'object') {
    throw new Error('config.locale is required')
  }
  const descriptor = parseSFC(sourceCode).descriptor
  const scriptCode = descriptor.scriptSetup?.content ?? descriptor.script?.content
  const templateCode = descriptor.template?.content
  let result = sourceCode
  const isMatchedStr = (text: string) => matchOrGenerateKey(locale, customMatcher, keyGenerator, text)

  // 模板转换
  if (enableTemplate && templateCode) {
    const templateOut = await templateTransformer(templateCode, isMatchedStr)
    result = result.replace(/(?<=<template>)([\s\S]*)(?=<\/template>)/g, templateOut)
  }
  // 脚本转换
  if (enableScript && scriptCode) {
    const { transformAsync } = await import('@babel/core')
    const scriptOut = await transformAsync(scriptCode, {
      plugins: [[scriptTransformer, { isMatchedStr }]],
    })
    if (scriptOut?.code)
      result = result.replace(/(?<=(<script).*?>)([\s\S]*)(?=<\/script>)/g, scriptOut.code)
  }
  if (debug) {
    console.log('[auto-i18n:core] transformed SFC')
  }
  return result
} 
