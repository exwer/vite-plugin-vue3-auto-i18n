import { parse as parseSFC } from '@vue/compiler-sfc'
import templateTransformer from '../plugins/template'
import { transformScript } from '../plugins/script'
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
  const isMatchedStr = (text: string) => matchOrGenerateKey(locale, customMatcher, keyGenerator, text)

  // 优化：直接构建结果字符串，避免多次替换
  let result = sourceCode
  
  // 模板转换
  if (enableTemplate && templateCode) {
    try {
      const templateOut = await templateTransformer(templateCode, isMatchedStr)
      // 使用更精确的替换方法
      const templateStart = sourceCode.indexOf('<template>')
      const templateEnd = sourceCode.lastIndexOf('</template>')
      if (templateStart !== -1 && templateEnd !== -1) {
        const beforeTemplate = sourceCode.substring(0, templateStart + '<template>'.length)
        const afterTemplate = sourceCode.substring(templateEnd)
        result = beforeTemplate + '\n' + templateOut + '\n' + afterTemplate
      }
    } catch (error) {
      if (debug) {
        console.error('[auto-i18n:core] template transform error:', error)
      }
      throw error
    }
  }
  
  // 脚本转换
  if (enableScript && scriptCode) {
    try {
      const scriptOut = await transformScript(scriptCode, isMatchedStr)
      // 使用更精确的替换方法
      const scriptStart = sourceCode.indexOf('<script')
      const scriptEnd = sourceCode.indexOf('</script>', scriptStart)
      if (scriptStart !== -1 && scriptEnd !== -1) {
        const scriptTagEnd = sourceCode.indexOf('>', scriptStart) + 1
        const beforeScript = result.substring(0, scriptTagEnd)
        const afterScript = result.substring(scriptEnd)
        result = beforeScript + '\n' + scriptOut + '\n' + afterScript
      }
    } catch (error) {
      if (debug) {
        console.error('[auto-i18n:core] script transform error:', error)
      }
      throw error
    }
  }
  
  if (debug) {
    console.log('[auto-i18n:core] transformed SFC')
  }
  
  return result
} 
