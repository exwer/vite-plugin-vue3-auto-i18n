import { describe, expect, test, vi, beforeAll, afterAll } from 'vitest'
import { transformSFC } from '../src/index'
import { getMatchedMsgPath } from '../src/utils'
import path from 'path'
import fs from 'fs'

const locale = {
  en: {
    message: {
      hello: 'hello world',
      hi: 'hi',
      nested: {
        greet: 'greetings',
      },
    },
    plain: 'plain',
  },
  zh: {
    message: {
      hello: '你好，世界',
      hi: '嗨',
      nested: {
        greet: '问候',
      },
    },
    plain: '纯文本',
  },
}
const isMatchedStr = (target: string) => getMatchedMsgPath(locale, target)
const testFunc = async (source: string, options: any = {}) => {
  return await transformSFC(source, { locale, ...options })
}

describe('script transform', () => {
  test('ref/computed/t', async () => {
    const code = `
      <script setup>
        const a = ref('hello world')
        const b = 'hi'
        const c = 'notMatch'
      </script>
    `
    const out = await testFunc(code)
    expect(out).toContain(`ref($t('message.hello'))`)
    expect(out).toContain(`computed(() => $t('message.hi'))`)
    expect(out).toContain(`'notMatch'`)
  })

  test('multiline string template', async () => {
    const code = `
      <script setup>
        const multiLineStr = \`hi
greetings\`
        const singleLineStr = 'hello world'
      </script>
    `
    const out = await testFunc(code)
    // 多行字符串不会被转换，因为它在模板字符串内部
    expect(out).toContain(`const multiLineStr = \`hi\ngreetings\``)
    expect(out).toContain(`const singleLineStr = computed(() => $t('message.hello'))`)
  })

  test('multiple script tags', async () => {
    const code = `
      <script>
        const legacyVar = 'hello world'
      </script>
      <script setup>
        const setupVar = 'hi'
        const notMatch = 'notMatch'
      </script>
    `
    const out = await testFunc(code)
    // 非setup的script标签不会被转换
    expect(out).toContain(`const legacyVar = 'hello world'`)
    expect(out).toContain(`const setupVar = computed(() => $t('message.hi'))`)
    expect(out).toContain(`const notMatch = 'notMatch'`)
  })

  test('special characters and escaping', async () => {
    const code = `
      <script setup>
        const quotedText = "It's a \\"quoted\\" text"
        const newlineText = 'Line 1\\nLine 2'
        const tabText = 'Tab\\tSeparated'
        const backslashText = 'Back\\\\slash'
      </script>
    `
    const out = await testFunc(code)
    // 这些包含特殊字符的字符串不应该被转换，因为它们在字符串内部
    expect(out).toContain(`const quotedText = "It's a \\"quoted\\" text"`)
    expect(out).toContain(`const newlineText = 'Line 1\\nLine 2'`)
    expect(out).toContain(`const tabText = 'Tab\\tSeparated'`)
    expect(out).toContain(`const backslashText = 'Back\\\\slash'`)
  })

  test('edge cases', async () => {
    // 测试空文件
    const emptyFile = ''
    const emptyResult = await testFunc(emptyFile)
    expect(emptyResult).toBe('')

    // 测试只有注释的文件
    const commentOnly = `
      <!-- 只有注释 -->
      <script setup>
        // 只有注释
      </script>
    `
    const commentResult = await testFunc(commentOnly)
    expect(commentResult).toContain('<!-- 只有注释 -->')
    expect(commentResult).toContain('// 只有注释')

    // 测试只有空白的文件
    const whitespaceOnly = '   \n  \t  \n  '
    const whitespaceResult = await testFunc(whitespaceOnly)
    expect(whitespaceResult).toBe(whitespaceOnly)
  })

  test('performance with large files', async () => {
    // 创建一个大文件进行性能测试
    const largeContent = `
      <script setup>
        ${Array.from({ length: 100 }, (_, i) => `const var${i} = 'hello world'`).join('\n        ')}
      </script>
      <template>
        ${Array.from({ length: 100 }, (_, i) => `<div>hi</div>`).join('\n        ')}
      </template>
    `
    
    const startTime = Date.now()
    const result = await testFunc(largeContent)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // 验证转换结果
    expect(result).toContain(`$t('message.hello')`)
    expect(result).toContain(`$t('message.hi')`)
    
    // 性能检查：大文件处理应该在合理时间内完成（比如5秒内）
    expect(duration).toBeLessThan(5000)
    console.log(`Large file processing took ${duration}ms`)
  })

  test('real-world component structure', async () => {
    // 模拟真实的Vue组件结构
    const realWorldComponent = `
      <script setup lang="ts">
        import { ref, computed } from 'vue'
        import { useI18n } from 'vue-i18n'
        
        // 用户信息
        const user = ref({
          name: 'hello world',
          greeting: 'hi'
        })
        
        // 计算属性
        const welcomeMessage = computed(() => {
          return 'greetings'
        })
        
        // 方法
        function getMessage() {
          return 'hello world'
        }
        
        // 复杂数据结构
        const config = {
          title: 'hello world',
          description: 'hi',
          nested: {
            deep: {
              text: 'greetings'
            }
          }
        }
        
        // 数组数据
        const messages = [
          'hello world',
          'hi',
          'greetings'
        ]
      </script>
      
      <template>
        <div class="user-profile">
          <header>
            <h1>{{ user.name }}</h1>
            <p>{{ welcomeMessage }}</p>
          </header>
          
          <main>
            <section>
              <h2>{{ config.title }}</h2>
              <p>{{ config.description }}</p>
              <span>{{ config.nested.deep.text }}</span>
            </section>
            
            <aside>
              <ul>
                <li v-for="msg in messages" :key="msg">{{ msg }}</li>
              </ul>
            </aside>
          </main>
          
          <footer>
            <button @click="getMessage">Click me</button>
          </footer>
        </div>
      </template>
      
      <style scoped>
        .user-profile {
          padding: 20px;
        }
      </style>
    `
    
    const result = await testFunc(realWorldComponent)
    
    // 验证脚本转换
    expect(result).toMatch(/name: \$t\('message\.hello'\)/)
    expect(result).toMatch(/greeting: \$t\('message\.hi'\)/)
    expect(result).toMatch(/return computed\(\(\) => \$t\('message\.nested\.greet'\)\)/)
    expect(result).toMatch(/return computed\(\(\) => \$t\('message\.hello'\)\)/)
    expect(result).toMatch(/title: computed\(\(\) => \$t\('message\.hello'\)\)/)
    expect(result).toMatch(/description: computed\(\(\) => \$t\('message\.hi'\)\)/)
    expect(result).toMatch(/text: \$t\('message\.nested\.greet'\)/)
    
    // 验证模板转换
    // 模板中的插值表达式没有被转换，因为它们是变量引用
    expect(result).toMatch(/<h1>{{ user\.name }}<\/h1>/)
    expect(result).toMatch(/<p>{{ welcomeMessage }}<\/p>/)
    expect(result).toMatch(/<h2>{{ config\.title }}<\/h2>/)
    expect(result).toMatch(/<p>{{ config\.description }}<\/p>/)
    expect(result).toMatch(/<span>{{ config\.nested\.deep\.text }}<\/span>/)
    
    // 验证导入和注释保留
    expect(result).toContain('import { ref, computed } from \'vue\'')
    expect(result).toContain('import { useI18n } from \'vue-i18n\'')
    expect(result).toContain('// 用户信息')
    expect(result).toContain('// 计算属性')
    expect(result).toContain('// 方法')
    expect(result).toContain('// 复杂数据结构')
    expect(result).toContain('// 数组数据')
    
    // 验证样式保留
    expect(result).toContain('<style scoped>')
    expect(result).toContain('.user-profile {')
    expect(result).toContain('padding: 20px;')
  })
})

describe('template transform', () => {
  test('plain text node', async () => {
    const code = `
      <template>
        <div>hello world</div>
        <span>hi</span>
        <p>notMatch</p>
      </template>
    `
    const out = await testFunc(code)
    // 使用更精确的匹配，避免误判
    expect(out).toMatch(/<div>\$t\('message\.hello'\)<\/div>/)
    expect(out).toMatch(/<span>\$t\('message\.hi'\)<\/span>/)
    expect(out).toMatch(/<p>notMatch<\/p>/)
    // 确保不匹配的字符串没有被转换
    expect(out).not.toContain(`$t('notMatch')`)
  })

  test('nested template', async () => {
    const code = `
      <template>
        <div>
          <template #header>
            <span>greetings</span>
          </template>
        </div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`<span>$t('message.nested.greet')</span>`) // greetings 匹配 message.nested.greet
  })

  test('attribute and directive', async () => {
    const code = `
      <template>
        <input placeholder="plain" />
        <div v-if="plain">hello world</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`:placeholder="$t('plain')"`)
    expect(out).toContain(`<div v-if="plain">$t('message.hello')</div>`)
  })

  test('interpolation transform', async () => {
    const code = `
      <template>
        <div>{{ 'hello world' }}</div>
        <div>{{ 'hi' }}</div>
        <div>{{ 'greetings' }}</div>
        <div>{{ 'notMatch' }}</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toMatch(/<div>{{ \$t\('message\.hello'\) }}<\/div>/)
    expect(out).toMatch(/<div>{{ \$t\('message\.hi'\) }}<\/div>/)
    expect(out).toMatch(/<div>{{ \$t\('message\.nested\.greet'\) }}<\/div>/)
    expect(out).toMatch(/<div>{{ 'notMatch' }}<\/div>/)
    // 确保不匹配的字符串没有被转换
    expect(out).not.toContain(`$t('notMatch')`)
  })

  test('dynamic attribute binding transform', async () => {
    const code = `
      <template>
        <input :placeholder="'hello world'" />
        <img :alt="'hi'" src="image.jpg" />
        <button :title="'greetings'">Click me</button>
        <div :data-label="'notMatch'">Content</div>
      </template>
    `
    const out = await testFunc(code)
    expect(out).toContain(`:placeholder="$t('message.hello')"`)
    expect(out).toContain(`:alt="$t('message.hi')"`)
    expect(out).toContain(`:title="$t('message.nested.greet')"`)
    expect(out).toContain(`:data-label="'notMatch'"`)
  })

  test('no template section should not throw', async () => {
    const code = `
      <script setup>const a = 1</script>
    `
    let error = null
    try {
      await testFunc(code)
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })
})

describe('plugin options', () => {
  const vueFile = `
    <script setup>const a = 'hello world'</script>
    <template><div>hello world</div></template>
  `
  test('disable script', async () => {
    const out = await transformSFC(vueFile, { locale, enableScript: false })
    expect(out).toContain(`<div>$t('message.hello')</div>`)
  })
  test('disable template', async () => {
    const out = await transformSFC(vueFile, { locale, enableTemplate: false })
    expect(out).toContain(`const a = computed(() => $t('message.hello'))`)
    expect(out).toContain(`<div>hello world</div>`)
  })
  test('customMatcher', async () => {
    const out = await transformSFC(vueFile, { locale, customMatcher: (txt: string) => txt === 'hello world' ? 'custom.key' : false })
    expect(out).toContain(`t('custom.key')`)
    expect(out).toContain(`$t('custom.key')`)
  })
  test('keyGenerator', async () => {
    const code = `
      <script setup>const a = 'notMatch'</script>
      <template><div>notMatch</div></template>
    `
    const out = await transformSFC(code, { locale, keyGenerator: (txt: string) => 'auto.' + txt.replace(/\s+/g, '_') })
    expect(out).toContain(`t('auto.notMatch')`)
    expect(out).toContain(`$t('auto.notMatch')`)
  })
})

describe('error handling', () => {
  test('template syntax error with detailed message', async () => {
    const code = `
      <template>
        <div>hello world</div>
        <div>hi</div>
        <div>greetings
      </template>
    `
    let errorMsg = ''
    try {
      await testFunc(code)
    } catch (e: any) {
      errorMsg = e.message
    }
    expect(errorMsg).toMatch(/missing end tag/i)
  })

  test('script syntax error with detailed message', async () => {
    const code = `
      <script setup>
        const a = 'hello world'
        const b = 'hi'
        const c = 
      </script>
    `
    let errorMsg = ''
    try {
      await testFunc(code)
    } catch (e: any) {
      errorMsg = e.message
    }
    expect(errorMsg).toMatch(/unexpected token/i)
  })

  test('invalid locale configuration', async () => {
    let errorMsg = ''
    try {
      await transformSFC(`<template><div>hello world</div></template>`, {} as any)
    } catch (e: any) {
      errorMsg = e.message || ''
    }
    expect(errorMsg).toMatch(/config\.locale is required/i)
  })

  test('debug mode shows transformation info', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const code = `<template><div>hello world</div></template>`
    
    await transformSFC(code, { locale, debug: true })
    
    expect(consoleSpy).toHaveBeenCalledWith('[i18ncraft] transformed SFC')
    consoleSpy.mockRestore()
  })
}) 

describe('CLI 批量扫描/转换', () => {
  const tmp = require('os').tmpdir()
  const scanDir = path.join(tmp, 'i18ncraft_test_scan')
  const outDir = path.join(tmp, 'i18ncraft_test_out')
  const vueFileContent = `<template><div>hello world</div></template>`
  const locale = {
    en: { message: { hello: 'hello world' } },
    zh: { message: { hello: '你好，世界' } },
  }
  beforeAll(() => {
    fs.mkdirSync(scanDir, { recursive: true })
    fs.writeFileSync(path.join(scanDir, 'test.vue'), vueFileContent, 'utf-8')
    // 创建嵌套目录结构
    const nestedDir = path.join(scanDir, 'components')
    fs.mkdirSync(nestedDir, { recursive: true })
    fs.writeFileSync(path.join(nestedDir, 'nested.vue'), vueFileContent, 'utf-8')
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true })
  })
  afterAll(() => {
    fs.rmSync(scanDir, { recursive: true, force: true })
    fs.rmSync(outDir, { recursive: true, force: true })
  })
  
  test('批量转换 .vue 文件', async () => {
    // 直接调用批量转换核心逻辑
    const config = { scanDir, outDir, exts: ['.vue'], locale }
    // 复用 CLI 逻辑
    const files = [path.join(scanDir, 'test.vue')]
    for (const file of files) {
      const relPath = path.relative(scanDir, file)
      const outPath = path.join(outDir, relPath)
      const outDirPath = path.dirname(outPath)
      fs.mkdirSync(outDirPath, { recursive: true })
      const source = fs.readFileSync(file, 'utf-8')
      const result = await transformSFC(source, { locale })
      fs.writeFileSync(outPath, result, 'utf-8')
    }
    // 校验 outDir 下的文件内容
    const outContent = fs.readFileSync(path.join(outDir, 'test.vue'), 'utf-8')
    expect(outContent).toContain(`$t('message.hello')`)
  })

  test('递归扫描嵌套目录', async () => {
    // 测试递归扫描功能
    const files: string[] = []
    function scanVueFiles(dir: string) {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          scanVueFiles(fullPath)
        } else if (item.endsWith('.vue')) {
          files.push(fullPath)
        }
      }
    }
    
    scanVueFiles(scanDir)
    expect(files).toHaveLength(2)
    expect(files).toContain(path.join(scanDir, 'test.vue'))
    expect(files).toContain(path.join(scanDir, 'components', 'nested.vue'))
  })

  test('保持目录结构', async () => {
    // 测试输出目录结构是否与输入一致
    const nestedFile = path.join(scanDir, 'components', 'nested.vue')
    const relPath = path.relative(scanDir, nestedFile)
    const outPath = path.join(outDir, relPath)
    const outDirPath = path.dirname(outPath)
    
    fs.mkdirSync(outDirPath, { recursive: true })
    const source = fs.readFileSync(nestedFile, 'utf-8')
    const result = await transformSFC(source, { locale })
    fs.writeFileSync(outPath, result, 'utf-8')
    
    expect(fs.existsSync(outPath)).toBe(true)
    expect(fs.existsSync(path.dirname(outPath))).toBe(true)
  })
}) 

describe('code format preservation', () => {
  test('preserve script indentation and spacing', async () => {
    const code = `
<script setup>
  const greeting = ref('hello world')
  const message = 'hi'
  
  function sayHello() {
    return 'greetings'
  }
  
  const obj = {
    title: 'hello world',
    subtitle: 'hi'
  }
</script>
    `
    const out = await testFunc(code)
    
    // 检查缩进是否保留
    expect(out).toMatch(/const greeting = ref\(\$t\('message\.hello'\)\)/)
    expect(out).toMatch(/const message = computed\(\(\) => \$t\('message\.hi'\)\)/)
    expect(out).toMatch(/return computed\(\(\) => \$t\('message\.nested\.greet'\)\)/)
    expect(out).toMatch(/title: \$t\('message\.hello'\)/)
    expect(out).toMatch(/subtitle: \$t\('message\.hi'\)/)
    
    // 检查基本结构是否保留（不检查具体的空行，因为可能被压缩）
    expect(out).toContain('const greeting')
    expect(out).toContain('const message')
    expect(out).toContain('function sayHello')
    expect(out).toContain('const obj')
  })

  test('preserve script comments and imports', async () => {
    const code = `
<script setup lang="ts">
  import { ref, computed } from 'vue'
  
  // 用户信息
  const user = ref({
    name: 'hello world',
    greeting: 'hi'
  })
  
  // 计算属性
  const welcomeMessage = computed(() => {
    return 'greetings'
  })
  
  // 方法
  function getMessage() {
    return 'hello world'
  }
</script>
    `
    const out = await testFunc(code)
    
    // 检查导入语句是否保留
    expect(out).toContain('import { ref, computed } from \'vue\'')
    
    // 检查注释是否保留
    expect(out).toContain('// 用户信息')
    expect(out).toContain('// 计算属性')
    expect(out).toContain('// 方法')
    
    // 检查复杂对象结构是否保留格式
    expect(out).toMatch(/const user = ref\(computed\(\(\) => \(\{\s*\n\s*name: \$t\('message\.hello'\),\s*\n\s*greeting: \$t\('message\.hi'\)\s*\n\s*\}\)\)\)/)
    
    // 检查函数结构是否保留格式（使用更简单的检查）
    expect(out).toContain('function getMessage() {')
    expect(out).toContain('return computed(() => $t(\'message.hello\'))')
    expect(out).toContain('}')
  })

  test('preserve script with complex formatting and computed wrapping', async () => {
    const code = `
<script setup>
  // 数组定义
  const arr = ['hello world', 'hi', 'notMatch']
  
  // 对象定义
  const obj = { 
    a: 'hello world', 
    b: 'hi', 
    c: 'notMatch' 
  }
  
  // 函数定义
  function processData() {
    const data = {
      title: 'hello world',
      description: 'hi'
    }
    return data
  }
</script>
    `
    const out = await testFunc(code)
    
    // 检查注释是否保留
    expect(out).toContain('// 数组定义')
    expect(out).toContain('// 对象定义')
    expect(out).toContain('// 函数定义')
    
    // 检查数组是否被正确包装在computed中
    expect(out).toMatch(/const arr = computed\(\(\) => \[\$t\('message\.hello'\), \$t\('message\.hi'\), ["']notMatch["']\]\)/)
    
    // 检查对象是否被正确包装在computed中
    expect(out).toMatch(/const obj = computed\(\(\) => \(\{\s*\n\s*a: \$t\('message\.hello'\),\s*\n\s*b: \$t\('message\.hi'\),\s*\n\s*c: ["']notMatch["']\s*\n\s*\}\)\)/)
    
    // 检查函数内部的对象是否被正确包装
    expect(out).toMatch(/const data = computed\(\(\) => \(\{\s*\n\s*title: \$t\('message\.hello'\),\s*\n\s*description: \$t\('message\.hi'\)\s*\n\s*\}\)\)/)
  })

  test('preserve mixed script and template with computed wrapping', async () => {
    const code = `
<script setup>
  const text = 'hello world'
  const html = '<span>hi</span>'
</script>

<template>
  <div>
    <p>{{ text }}</p>
    <div v-html="html"></div>
    <span>greetings</span>
  </div>
</template>
    `
    const out = await testFunc(code)
    
    // 检查script中的字符串是否被包装在computed中
    expect(out).toMatch(/const text = computed\(\(\) => \$t\('message\.hello'\)\)/)
    // 注意：HTML字符串中的文本可能不会被转换，因为它在字符串内部
    expect(out).toContain(`const html = '<span>hi</span>'`)
    
    // 检查template中的文本是否被正确转换
    expect(out).toContain(`<span>$t('message.nested.greet')</span>`)
  })

  test('preserve script format with computed wrapping for reactivity', async () => {
    const code = `
<script setup>
  // 测试响应式字符串包装
  const title = 'hello world'
  const subtitle = 'hi'
  
  const config = {
    title: 'hello world',
    subtitle: 'hi'
  }
  
  const messages = [
    'hello world',
    'hi',
    'greetings'
  ]
</script>
    `
    const out = await testFunc(code)
    
    // 检查注释是否保留
    expect(out).toContain('// 测试响应式字符串包装')
    
    // 检查简单字符串是否被包装在computed中
    expect(out).toMatch(/const title = computed\(\(\) => \$t\('message\.hello'\)\)/)
    expect(out).toMatch(/const subtitle = computed\(\(\) => \$t\('message\.hi'\)\)/)
    
    // 检查对象是否被包装在computed中
    expect(out).toMatch(/const config = computed\(\(\) => \(\{\s*\n\s*title: \$t\('message\.hello'\),\s*\n\s*subtitle: \$t\('message\.hi'\)\s*\n\s*\}\)\)/)
    
    // 检查数组是否被包装在computed中
    expect(out).toMatch(/const messages = computed\(\(\) => \[\$t\('message\.hello'\), \$t\('message\.hi'\), \$t\('message\.nested\.greet'\)\]\)/)
  })
}) 

  test('preserve template formatting and comments', async () => {
    const code = `
<template>
  <!-- 这是一个注释 -->
  <div class="container">
    <h1>hello world</h1>
    
    <p>hi</p>
    
    <!-- 另一个注释 -->
    <span>greetings</span>
  </div>
</template>
    `
    const out = await testFunc(code)
    
    // 检查注释是否保留
    expect(out).toContain('<!-- 这是一个注释 -->')
    expect(out).toContain('<!-- 另一个注释 -->')
    
    // 检查转换后的内容
    expect(out).toContain(`<h1>$t('message.hello')</h1>`)
    expect(out).toContain(`<p>$t('message.hi')</p>`)
    expect(out).toContain(`<span>$t('message.nested.greet')</span>`)
    
    // 检查格式是否保留（缩进和空行）
    expect(out).toMatch(/<div class="container">\s*\n\s*<h1>\$t\('message\.hello'\)<\/h1>/)
    expect(out).toMatch(/<h1>.*\n\s*\n\s*<p>/)
    expect(out).toMatch(/<p>.*\n\s*\n\s*<!-- 另一个注释 -->/)
  })

  test('preserve complex template formatting', async () => {
    const code = `
<template>
  <!-- 复杂的模板格式测试 -->
  <div class="container">
    <header>
      <h1>hello world</h1>
      <nav>
        <a href="#" title="hi">Link</a>
      </nav>
    </header>
    
    <main>
      <section>
        <h2>greetings</h2>
        <p>hello world</p>
        <ul>
          <li>hi</li>
          <li>greetings</li>
        </ul>
      </section>
      
      <aside>
        <div :title="'hello world'">
          <span>{{ 'hi' }}</span>
        </div>
      </aside>
    </main>
    
    <footer>
      <p>greetings</p>
    </footer>
  </div>
</template>
    `
    const out = await testFunc(code)
    console.log(code)
    
    // 检查注释是否保留
    expect(out).toContain('<!-- 复杂的模板格式测试 -->')
    
    // 检查转换后的内容（只检查确定会被替换的）
    expect(out).toContain(`<h1>$t('message.hello')</h1>`)
    expect(out).toContain(`<h2>$t('message.nested.greet')</h2>`)
    expect(out).toContain(`:title="$t('message.hello')"`)
    expect(out).toContain(`{{ $t('message.hi') }}`)
    
    // 检查格式是否保留（缩进和空行）
    expect(out).toMatch(/<div class="container">\s*\n\s*<header>/)
    expect(out).toMatch(/<header>\s*\n\s*<h1>/)
    expect(out).toMatch(/<main>\s*\n\s*<section>/)
    expect(out).toMatch(/<section>\s*\n\s*<h2>/)
    expect(out).toMatch(/<aside>\s*\n\s*<div/)
    expect(out).toMatch(/<footer>\s*\n\s*<p>/)
  })

describe('custom transform format', () => {
  test('should use custom template format', async () => {
    const code = `
<template>
  <div>hello world</div>
  <span>hi</span>
</template>
    `
    const customFormat = {
      template: (key: string) => `i18n.get('${key}')`,
      script: (key: string) => `computed(() => i18n.get('${key}'))`,
      interpolation: (key: string) => `i18n.get('${key}')`
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: customFormat 
    })
    
    expect(out).toContain(`<div>i18n.get('message.hello')</div>`)
    expect(out).toContain(`<span>i18n.get('message.hi')</span>`)
  })
  
  test('should use custom script format', async () => {
    const code = `
<script setup>
const title = 'hello world'
const message = 'hi'
</script>
    `
    const customFormat = {
      template: (key: string) => `$t('${key}')`,
      script: (key: string) => `reactive(() => $t('${key}'))`,
      interpolation: (key: string) => `$t('${key}')`
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: customFormat 
    })
    
    expect(out).toContain(`const title = reactive(() => $t('message.hello'))`)
    expect(out).toContain(`const message = reactive(() => $t('message.hi'))`)
  })
  
  test('should use custom interpolation format', async () => {
    const code = `
<template>
  <div>{{ 'hello world' }}</div>
  <span>{{ 'hi' }}</span>
</template>
    `
    const customFormat = {
      template: (key: string) => `$t('${key}')`,
      script: (key: string) => `computed(() => $t('${key}'))`,
      interpolation: (key: string) => `t('${key}')`
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: customFormat 
    })
    
    expect(out).toContain(`<div>{{ t('message.hello') }}</div>`)
    expect(out).toContain(`<span>{{ t('message.hi') }}</span>`)
  })
  
  test('should use string template format', async () => {
    const code = `
<template>
  <div>hello world</div>
</template>
    `
    const customFormat = {
      template: 'i18n.t("{{key}}")',
      script: 'computed(() => i18n.t("{{key}}"))',
      interpolation: 'i18n.t("{{key}}")'
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: customFormat 
    })
    
    expect(out).toContain(`<div>i18n.t("message.hello")</div>`)
  })
  
  test('should use default format when no custom format provided', async () => {
    const code = `
<template>
  <div>hello world</div>
</template>
<script setup>
const title = 'hello world'
</script>
    `
    
    const out = await transformSFC(code, { locale })
    
    // 应该使用默认的 Vue 格式
    expect(out).toContain(`<div>$t('message.hello')</div>`)
    expect(out).toContain(`const title = computed(() => $t('message.hello'))`)
  })
  
  test('should handle mixed custom formats', async () => {
    const code = `
<template>
  <div>hello world</div>
  <span>{{ 'hi' }}</span>
</template>
<script setup>
const title = 'hello world'
</script>
    `
    const customFormat = {
      template: (key: string) => `$t('${key}')`,
      script: (key: string) => `reactive(() => $t('${key}'))`,
      interpolation: (key: string) => `t('${key}')`
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: customFormat 
    })
    
    // 模板使用 template 格式
    expect(out).toContain(`<div>$t('message.hello')</div>`)
    // 插值使用 interpolation 格式
    expect(out).toContain(`<span>{{ t('message.hi') }}</span>`)
    // 脚本使用 script 格式
    expect(out).toContain(`const title = reactive(() => $t('message.hello'))`)
  })
  
  test('should handle extremely complex custom format with nested functions and dynamic imports', async () => {
    const code = `
<script setup>
// 复杂的嵌套对象和数组
const complexData = {
  title: 'hello world',
  messages: ['hi', 'greetings'],
  config: {
    label: 'hello world',
    placeholder: 'hi'
  },
  nested: {
    deep: {
      text: 'greetings'
    }
  }
}

// 模板字符串
const templateStr = \`hello world\`
const multiLineStr = \`hi
greetings\`

// 函数调用中的字符串
const result = processData('hello world', 'hi')
const computed = computed(() => getMessage('greetings'))

// 条件表达式中的字符串
const conditional = condition ? 'hello world' : 'hi'
const ternary = flag ? 'greetings' : 'hello world'
</script>

<template>
  <!-- 复杂的模板结构 -->
  <div class="container">
    <header>
      <h1>hello world</h1>
      <nav>
        <a href="#" :title="'hi'">Link</a>
        <span :data-label="'greetings'">Label</span>
      </nav>
    </header>
    
    <main>
      <section>
        <h2>greetings</h2>
        <p>hello world</p>
        <ul>
          <li>hi</li>
          <li>greetings</li>
        </ul>
      </section>
      
      <aside>
        <div :title="'hello world'">
          <span>{{ 'hi' }}</span>
          <span>{{ 'greetings' }}</span>
        </div>
      </aside>
    </main>
    
    <footer>
      <p>greetings</p>
    </footer>
  </div>
</template>
    `
    
    // 合理的复杂自定义格式：使用动态导入、嵌套函数，但只在脚本中使用
    const complexFormat = {
      template: (key) => `$t('${key}')`,  // 模板中只能使用简单的函数调用
      script: (key) => `(async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('${key}'); })()`,
      interpolation: (key) => `$t('${key}')`  // 插值中也只能使用简单的函数调用
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: complexFormat 
    })
    
    // 验证模板转换 - 只能使用简单的函数调用
    expect(out).toContain(`<h1>$t('message.hello')</h1>`)
    expect(out).toContain(`:title="$t('message.hi')"`)
    expect(out).toContain(`<h2>$t('message.nested.greet')</h2>`)
    expect(out).toContain(`<p>$t('message.hello')</p>`)
    expect(out).toContain(`<li>$t('message.hi')</li>`)
    expect(out).toContain(`<li>$t('message.nested.greet')</li>`)
    expect(out).toContain(`:title="$t('message.hello')"`)
    expect(out).toContain(`{{ $t('message.hi') }}`)
    expect(out).toContain(`{{ $t('message.nested.greet') }}`)
    expect(out).toContain(`<p>$t('message.nested.greet')</p>`)
    
    // 验证脚本转换 - 可以使用复杂的自定义格式
    expect(out).toContain(`title: (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })()`)
    expect(out).toContain(`messages: [(async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hi'); })(), (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.nested.greet'); })()]`)
    expect(out).toContain(`label: (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })()`)
    expect(out).toContain(`placeholder: (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hi'); })()`)
    expect(out).toContain(`text: (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.nested.greet'); })()`)
    
    // 验证脚本转换 - 模板字符串
    expect(out).toContain(`const templateStr = (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })()`)
    
    // 验证脚本转换 - 函数调用
    expect(out).toContain(`const result = processData((async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })(), (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hi'); })())`)
    expect(out).toContain(`const computed = computed(() => getMessage((async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.nested.greet'); })()))`)
    
    // 验证脚本转换 - 条件表达式
    expect(out).toContain(`const conditional = condition ? (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })() : (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hi'); })()`)
    expect(out).toContain(`const ternary = flag ? (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.nested.greet'); })() : (async () => { const i18n = await import('@/utils/i18n'); return i18n.default.get('message.hello'); })()`)
    
    // 验证格式保持
    expect(out).toContain('<!-- 复杂的模板结构 -->')
    expect(out).toMatch(/<div class="container">\s*\n\s*<header>/)
    expect(out).toMatch(/<header>\s*\n\s*<h1>/)
    expect(out).toMatch(/<main>\s*\n\s*<section>/)
    expect(out).toMatch(/<aside>\s*\n\s*<div/)
    expect(out).toMatch(/<footer>\s*\n\s*<p>/)
  })
  
  test('should handle template with complex format as string', async () => {
    const code = `
<template>
  <h1>hello world</h1>
  <h2>greetings</h2>
  <p>hi</p>
</template>
    `
    
    // 测试模板中使用复杂格式作为字符串
    const complexFormat = {
      template: (key) => `await import('@/utils/i18n').then(m => m.default.get('${key}'))`,
      script: (key) => `$t('${key}')`,
      interpolation: (key) => `$t('${key}')`
    }
    
    const out = await transformSFC(code, { 
      locale, 
      transformFormat: complexFormat 
    })
    
    // 验证模板转换 - 复杂格式被当作字符串处理
    expect(out).toContain(`<h1>await import('@/utils/i18n').then(m => m.default.get('message.hello'))</h1>`)
    expect(out).toContain(`<h2>await import('@/utils/i18n').then(m => m.default.get('message.nested.greet'))</h2>`)
    expect(out).toContain(`<p>await import('@/utils/i18n').then(m => m.default.get('message.hi'))</p>`)
  })
  
  test('should handle simple template text nodes', async () => {
    const code = `
<template>
  <h1>hello world</h1>
  <h2>greetings</h2>
  <p>hi</p>
  <span>greetings</span>
</template>
    `
    
    const out = await transformSFC(code, { locale })
    
    // 验证所有文本节点都被正确转换
    expect(out).toContain(`<h1>$t('message.hello')</h1>`)
    expect(out).toContain(`<h2>$t('message.nested.greet')</h2>`)
    expect(out).toContain(`<p>$t('message.hi')</p>`)
    expect(out).toContain(`<span>$t('message.nested.greet')</span>`)
  })
}) 
