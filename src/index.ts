import * as fs from 'fs'
import * as path from 'path'
import * as VueCompiler from '@vue/compiler-sfc'

function parser() {
  try {
    const source = fs.readFileSync(path.join(__dirname, '../test/source.vue'), 'utf-8')
    const { descriptor } = VueCompiler.parse(source)
    const { content } = VueCompiler.compileScript(descriptor, { id: '123' })
    fs.writeFileSync(path.join(__dirname, '../test/snapshot.js'), content)
  }
  catch (error) {
    console.error(error)
  }
}

parser()
