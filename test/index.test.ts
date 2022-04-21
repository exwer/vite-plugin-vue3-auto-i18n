import * as fs from 'fs'
import * as path from 'path'
import { describe, expect, it } from 'vitest'
import * as VueCompiler from '@vue/compiler-sfc'
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
describe('should', () => {
  compile(path.join(__dirname, './source.vue'), path.join(__dirname, './__snapshots__/source.js'))
  compile(path.join(__dirname, './result.vue'), path.join(__dirname, './__snapshots__/result.js'))
  it('exported', () => {
    expect(1).toEqual(1)
  })
})
