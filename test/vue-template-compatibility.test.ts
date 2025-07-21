import { describe, it, expect } from 'vitest'
import { VueTransformer } from '../src/core/transformer/vue'
import { VueI18nProvider } from '../src/core/providers/vue-i18n'

describe('Vue Template Transformation Compatibility', () => {
  const locale = {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome to our app',
        submit: 'Submit',
        cancel: 'Cancel',
        placeholder: {
          name: 'Enter your name',
          email: 'Enter your email'
        },
        button: {
          save: 'Save Changes',
          delete: 'Delete Item'
        },
        status: {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error occurred'
        },
        item: 'item',
        items: 'items'
      }
    }
  }

  const createTransformer = (sourceCode: string) => {
    return new VueTransformer(sourceCode, {
      locale,
      provider: VueI18nProvider
    })
  }

  describe('✅ 完全兼容的语法', () => {
    it('应该处理基本文本插值', async () => {
      const source = `
<template>
  <div>
    <p>Hello World</p>
    <span>Welcome to our app</span>
  </div>
</template>
<script setup>
</script>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
      expect(result.matches).toHaveLength(2)
    })

    it('应该处理属性绑定', async () => {
      const source = `
<template>
  <div>
    <input placeholder="Enter your name" />
    <button title="Submit">Click me</button>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain(':placeholder="$t(\'message.placeholder.name\')"')
      expect(result.code).toContain(':title="$t(\'message.submit\')"')
    })

    it('应该处理v-text指令', async () => {
      const source = `
<template>
  <div>
    <p v-text="'Hello World'"></p>
    <span v-text="message"></span>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // v-text with string literal should be transformed
      expect(result.code).toContain('v-text="$t(\'message.hello\')"')
      // v-text with variable should remain unchanged
      expect(result.code).toContain('v-text="message"')
    })

    it('应该处理v-html指令（谨慎使用）', async () => {
      const source = `
<template>
  <div>
    <div v-html="'<strong>Hello World</strong>'"></div>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 注意：v-html应该谨慎处理，可能存在XSS风险
      expect(result.code).toContain('v-html="$t(\'message.hello\')"')
    })
  })

  describe('⚠️ 部分兼容的语法', () => {
    it('应该处理v-bind动态属性（需要特殊处理）', async () => {
      const source = `
<template>
  <div>
    <input :placeholder="'Enter your name'" />
    <button :[dynamicAttr]="'Submit'">Click</button>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 静态属性值应该被转换
      expect(result.code).toContain(':placeholder="$t(\'message.placeholder.name\')"')
      // 动态属性名的值也应该被转换
      expect(result.code).toContain(':[dynamicAttr]="$t(\'message.submit\')"')
    })

    it('应该处理条件渲染中的文本', async () => {
      const source = `
<template>
  <div>
    <p v-if="showMessage">Hello World</p>
    <p v-else-if="showWelcome">Welcome to our app</p>
    <p v-else>Loading...</p>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
      expect(result.code).toContain('{{ $t(\'message.status.loading\') }}')
    })

    it('应该处理列表渲染中的文本', async () => {
      const source = `
<template>
  <div>
    <ul>
      <li v-for="item in items" :key="item.id">
        <span>Loading...</span>
        <button>Delete Item</button>
      </li>
    </ul>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain('{{ $t(\'message.status.loading\') }}')
      expect(result.code).toContain('{{ $t(\'message.button.delete\') }}')
    })

    it('应该处理插槽内容', async () => {
      const source = `
<template>
  <div>
    <my-component>
      <template #header>
        <h1>Hello World</h1>
      </template>
      <template #default>
        <p>Welcome to our app</p>
      </template>
      <template v-slot:footer>
        <button>Submit</button>
      </template>
    </my-component>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
      expect(result.code).toContain('{{ $t(\'message.submit\') }}')
    })
  })

  describe('❌ 不兼容或需要特殊处理的语法', () => {
    it('不应该处理JavaScript表达式中的字符串', async () => {
      const source = `
<template>
  <div>
    <p>{{ user.name || 'Guest' }}</p>
    <button @click="alert('Hello World')">Click</button>
    <input :value="getValue('default')" />
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // JavaScript表达式中的字符串不应该被直接转换
      // 这需要更智能的AST分析
      expect(result.code).toContain("user.name || 'Guest'")
      expect(result.code).toContain("alert('Hello World')")
      expect(result.code).toContain("getValue('default')")
    })

    it('不应该处理v-for中的复杂表达式', async () => {
      const source = `
<template>
  <div>
    <div v-for="(item, index) in items.filter(i => i.status === 'active')" :key="index">
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 复杂的JavaScript表达式不应该被转换
      expect(result.code).toContain("i.status === 'active'")
    })

    it('不应该处理事件处理器中的字符串', async () => {
      const source = `
<template>
  <div>
    <button @click="$emit('update', 'Hello World')">Update</button>
    <input @input="handleInput($event, 'default')" />
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 事件处理器中的字符串参数不应该被转换
      expect(result.code).toContain("$emit('update', 'Hello World')")
      expect(result.code).toContain("handleInput($event, 'default')")
    })

    it('应该谨慎处理组件props', async () => {
      const source = `
<template>
  <div>
    <my-component 
      title="Hello World"
      :message="'Welcome to our app'"
      :config="{ text: 'Submit' }"
    />
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 静态props可以转换
      expect(result.code).toContain(':title="$t(\'message.hello\')"')
      // 动态props中的字符串也可以转换
      expect(result.code).toContain(':message="$t(\'message.welcome\')"')
      // 但对象中的字符串需要更复杂的处理
    })
  })

  describe('🚫 Vue-i18n特殊语法兼容性', () => {
    it('应该保留已存在的$t调用', async () => {
      const source = `
<template>
  <div>
    <p>{{ $t('existing.key') }}</p>
    <span>Hello World</span>
    <button :title="$t('button.tooltip')">{{ $t('button.label') }}</button>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 已存在的$t调用应该保持不变
      expect(result.code).toContain("{{ $t('existing.key') }}")
      expect(result.code).toContain(':title="$t(\'button.tooltip\')"')
      expect(result.code).toContain("{{ $t('button.label') }}")
      
      // 新的文本应该被转换
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
    })

    it('应该处理i18n-t组件（Component Interpolation）', async () => {
      const source = `
<template>
  <div>
    <i18n-t keypath="message.welcome" tag="p">
      <template #name>
        <strong>Hello World</strong>
      </template>
    </i18n-t>
    <p>Simple text</p>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // i18n-t组件内的内容可能需要特殊处理
      // 简单文本仍应被转换
      expect(result.code).toContain('Simple text') // 这里应该被转换
    })

    it('应该处理复数形式', async () => {
      const source = `
<template>
  <div>
    <p>{{ $tc('message.item', count) }}</p>
    <span>item</span>
    <span>items</span>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // $tc调用应该保持不变
      expect(result.code).toContain("{{ $tc('message.item', count) }}")
      
      // 单独的复数形式文本应该被转换
      expect(result.code).toContain('{{ $t(\'message.item\') }}')
      expect(result.code).toContain('{{ $t(\'message.items\') }}')
    })
  })

  describe('🔧 边界情况和错误处理', () => {
    it('应该处理嵌套的HTML结构', async () => {
      const source = `
<template>
  <div>
    <div class="container">
      <header>
        <h1>Hello World</h1>
        <nav>
          <a href="/">Welcome to our app</a>
        </nav>
      </header>
      <main>
        <section>
          <p>Loading...</p>
        </section>
      </main>
    </div>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
      expect(result.code).toContain('{{ $t(\'message.status.loading\') }}')
    })

    it('应该处理空白字符和换行', async () => {
      const source = `
<template>
  <div>
    <p>
      Hello World
    </p>
    <span>   Welcome to our app   </span>
    <div>
      
      Loading...
      
    </div>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 应该正确处理前后空白字符
      expect(result.matches.some(m => m.original.trim() === 'Hello World')).toBe(true)
      expect(result.matches.some(m => m.original.trim() === 'Welcome to our app')).toBe(true)
      expect(result.matches.some(m => m.original.trim() === 'Loading...')).toBe(true)
    })

    it('应该跳过注释和CDATA', async () => {
      const source = `
<template>
  <div>
    <!-- This is a comment with Hello World -->
    <p>Hello World</p>
    <![CDATA[
      This is CDATA with Welcome to our app
    ]]>
    <span>Welcome to our app</span>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 注释和CDATA中的文本不应该被转换
      expect(result.code).toContain('<!-- This is a comment with Hello World -->')
      
      // 正常文本应该被转换
      expect(result.code).toContain('{{ $t(\'message.hello\') }}')
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
    })

    it('应该处理自闭合标签', async () => {
      const source = `
<template>
  <div>
    <input placeholder="Enter your name" />
    <img alt="Hello World" src="/image.jpg" />
    <hr />
    <br />
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      expect(result.code).toContain(':placeholder="$t(\'message.placeholder.name\')"')
      expect(result.code).toContain(':alt="$t(\'message.hello\')"')
    })
  })

  describe('📊 性能和限制', () => {
    it('应该处理大型模板', async () => {
      // 生成一个包含100个元素的大型模板
      const elements = Array.from({ length: 100 }, (_, i) => 
        `<p>Hello World</p>`
      ).join('\n    ')
      
      const source = `
<template>
  <div>
    ${elements}
  </div>
</template>`

      const transformer = createTransformer(source)
      const startTime = Date.now()
      const result = await transformer.transform()
      const endTime = Date.now()
      
      // 性能检查：应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(1000) // 1秒内
      
      // 应该找到所有匹配项（但只有"Hello World"会被匹配）
      expect(result.matches.length).toBeGreaterThan(0)
    })

    it('应该处理复杂的嵌套结构', async () => {
      const source = `
<template>
  <div>
    <div v-for="section in sections" :key="section.id">
      <h2>{{ section.title || 'Hello World' }}</h2>
      <div v-for="item in section.items" :key="item.id">
        <span v-if="item.status">Welcome to our app</span>
        <button @click="handleClick(item, 'Submit')">
          {{ item.label || 'Loading...' }}
        </button>
      </div>
    </div>
  </div>
</template>`

      const transformer = createTransformer(source)
      const result = await transformer.transform()
      
      // 应该找到静态文本
      expect(result.matches.some(m => m.original === 'Welcome to our app')).toBe(true)
      // JavaScript表达式中的字符串不应该被转换（这是正确的行为）
      expect(result.matches.some(m => m.original === 'Loading...')).toBe(false)
      
      // 静态文本应该被转换
      expect(result.code).toContain('{{ $t(\'message.welcome\') }}')
      // JavaScript表达式中的字符串不应该被转换
      expect(result.code).toContain('{{ item.label || \'Loading...\' }}')
    })
  })
}) 
