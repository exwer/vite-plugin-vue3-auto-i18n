import * as fs from 'fs'
import * as path from 'path'
import { describe, expect, it } from 'vitest'
import * as VueCompiler from '@vue/compiler-sfc'
import { start } from '../src/index'
function compile(path: string, target: string) {
  try {
    let result = ''
    const source = fs.readFileSync(
      path,
      'utf-8',
    )
    const { descriptor } = VueCompiler.parse(source)
    const { content: script } = VueCompiler.compileScript(descriptor, {
      id: '123',
    })
    const { code: template } = VueCompiler.compileTemplate({
      source: descriptor.template!.content.toString(),
      filename: 'fuck',
      id: '456',
    })
    result += script
    result += template
    fs.writeFileSync(target, result)
  }
  catch (error) {
    console.error(error)
  }
}
describe('import test', () => {
  it('single script', async() => {
    const source = '<script>import { a } from "b"</script>'
    const result = await start(source)
    expect(result).toMatchSnapshot()
  })
  it('complete vue file', async() => {
    const source = '<template><div></div></template><script></script><style></style>'
    const result = await start(source)
    expect(result).toMatchSnapshot()
  })
  it('repeat import', async() => {
    const source = '<script>import {ref} from "vue";import {useI18n} from "vue-i18n"</script>'
    const result = await start(source)
    expect(result).toMatchSnapshot()
  })
})
