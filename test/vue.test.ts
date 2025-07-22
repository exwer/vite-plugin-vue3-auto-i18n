import { describe, it, expect, beforeEach } from 'vitest'
import { VueTransformer } from '../src/core/transformer/vue'
import type { TransformOptions } from '../src/types'

describe('Vue Transformer', () => {
  let options: TransformOptions

  beforeEach(() => {
    options = {
      locale: {
        en: {
          message: {
            hello: 'Hello World',
            welcome: 'Welcome',
            submit: 'Submit',
            cancel: 'Cancel',
            loading: 'Loading...',
            success: 'Success!',
            error: 'Error occurred',
            clickMe: 'Click me',
            placeholder: 'Enter your name',
            email: 'Enter your email',
            save: 'Save',
            item: 'Item text',
            title: 'Page Title'
          }
        }
      }
    }
  })

  describe('Basic Transformation', () => {
    it('should transform Vue SFC with template and script', async () => {
      const sourceCode = `
<template>
  <div>
    <h1>Hello World</h1>
    <p>Welcome</p>
  </div>
</template>

<script setup>
const message = 'Hello World'
const greeting = 'Welcome'
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // Template transformations
      expect(result.code).toContain("{{ $t('message.hello') }}")
      expect(result.code).toContain("{{ $t('message.welcome') }}")

      // Script transformations with computed wrapping
      expect(result.code).toMatch(/const message = computed\(\(\) => t\("message\.hello"\)\)/)
      expect(result.code).toMatch(/const greeting = computed\(\(\) => t\("message\.welcome"\)\)/)

      // Imports and hooks
      expect(result.code).toMatch(/import.*computed.*from.*vue/)
      expect(result.code).toMatch(/import.*useI18n.*from.*vue-i18n/)
      expect(result.code).toMatch(/const\s*\{[\s\S]*t[\s\S]*\}\s*=\s*useI18n\(\)/)

      expect(result.matches).toHaveLength(4)
    })

    it('should handle template-only Vue files', async () => {
      const sourceCode = `
<template>
  <div>
    <h1>Hello World</h1>
    <p>Welcome</p>
  </div>
</template>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain("{{ $t('message.hello') }}")
      expect(result.code).toContain("{{ $t('message.welcome') }}")
      expect(result.matches).toHaveLength(2)
    })

    it('should handle script-only Vue files', async () => {
      const sourceCode = `
<script setup>
const message = 'Hello World'
const greeting = 'Welcome'
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toMatch(/const message = computed\(\(\) => t\("message\.hello"\)\)/)
      expect(result.code).toMatch(/const greeting = computed\(\(\) => t\("message\.welcome"\)\)/)
      expect(result.matches).toHaveLength(2)
    })
  })

  describe('Computed Optimization', () => {
    it('should wrap only top-level variables with computed, not individual strings', async () => {
      const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
const config = {
  title: 'Hello World',
  actions: {
    primary: 'Submit',
    secondary: 'Cancel'
  }
}

const messages = ['Welcome', 'Hello World']
const simpleText = 'Hello World'
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // Should wrap top-level variables with computed, inner strings use t()
      expect(result.code).toContain('const config = computed(() => ({')
      expect(result.code).toContain('title: t("message.hello")')
      expect(result.code).toContain('primary: t("message.submit")')
      expect(result.code).toContain('secondary: t("message.cancel")')
      
      expect(result.code).toContain('const messages = computed(() => [')
      expect(result.code).toContain('t("message.welcome")')
      
      expect(result.code).toContain('const simpleText = computed(() => t("message.hello"))')

      // Should not have nested computed in object properties
      expect(result.code).not.toContain('primary: computed(')
      expect(result.code).not.toContain('secondary: computed(')
    })

    it('should handle ref and reactive variables correctly', async () => {
      const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const refMessage = ref('Hello World')
const reactiveConfig = reactive({
  title: 'Welcome',
  actions: {
    submit: 'Submit'
  }
})

const normalVar = 'Hello World'
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // ref should be converted to computed
      expect(result.code).toContain('const refMessage = computed(() => t("message.hello"))')
      expect(result.code).not.toContain('ref(')

      // reactive should be converted to computed
      expect(result.code).toContain('const reactiveConfig = computed(() => ({')
      expect(result.code).toContain('title: t("message.welcome")')
      expect(result.code).toContain('submit: t("message.submit")')
      expect(result.code).not.toContain('reactive(')

      // normal variable should use computed
      expect(result.code).toContain('const normalVar = computed(() => t("message.hello"))')
    })

    it('should preserve non-i18n content in ref and reactive', async () => {
      const sourceCode = `
<template>
  <div>Test</div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const userId = ref(123)
const userConfig = reactive({
  id: 456,
  theme: 'dark',
  message: 'Hello World'  // Only this should be transformed
})

const apiUrl = ref('/api/users')
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // Numbers and non-matching strings should stay as ref/reactive
      expect(result.code).toContain('const userId = ref(123)')
      expect(result.code).toContain("const apiUrl = ref('/api/users')")
      
      // Only matching strings should be transformed
      expect(result.code).toContain('const userConfig = computed(() => ({')
      expect(result.code).toContain('id: 456')
      expect(result.code).toContain("theme: 'dark'")
      expect(result.code).toContain('message: t("message.hello")')
    })
  })

  describe('Template Compatibility', () => {
    it('should handle basic text and static attributes', async () => {
      const sourceCode = `
<template>
  <div>
    <h1>Hello World</h1>
    <input placeholder="Enter your name" />
    <button title="Submit">Click me</button>
  </div>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain("{{ $t('message.hello') }}")
      expect(result.code).toContain(':placeholder="$t(\'message.placeholder\')"')
      expect(result.code).toContain(':title="$t(\'message.submit\')"')
      expect(result.matches).toHaveLength(4) // Hello, placeholder, submit, clickMe
    })

    it('should handle dynamic attributes and directives', async () => {
      const sourceCode = `
<template>
  <div>
    <input :placeholder="'Enter your email'" />
    <button :[dynamicAttr]="'Submit'">Click</button>
    <p v-text="'Hello World'"></p>
    <div v-html="'<strong>Welcome</strong>'"></div>
  </div>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain(':placeholder="$t(\'message.email\')"')
      expect(result.code).toContain(':[dynamicAttr]="$t(\'message.submit\')"')
      expect(result.code).toContain('v-text="$t(\'message.hello\')"')
      expect(result.code).toContain('v-html="$t(\'message.welcome\')"')
      expect(result.matches).toHaveLength(4)
    })

    it('should handle component props with complex expressions', async () => {
      const sourceCode = `
<template>
  <div>
    <my-component 
      :config="{ text: 'Hello World', label: 'Submit' }"
      :items="['Loading...', 'Success!']"
    />
  </div>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain('text: $t(\'message.hello\')')
      expect(result.code).toContain('label: $t(\'message.submit\')')
      expect(result.code).toContain('$t(\'message.loading\')')
      expect(result.code).toContain('$t(\'message.success\')')
      expect(result.matches).toHaveLength(4)
    })

    it('should intelligently skip JavaScript expressions and existing i18n calls', async () => {
      const sourceCode = `
<template>
  <div>
    <!-- Should be transformed -->
    <h1>Hello World</h1>
    
    <!-- Should be skipped (JavaScript expression) -->
    <p>{{ user.name || 'Guest' }}</p>
    <button @click="alert('Debug info')">Debug</button>
    
    <!-- Should be skipped (existing i18n calls) -->
    <p>{{ $t('existing.key') }}</p>
    <span>{{ $tc('message.item', count) }}</span>
  </div>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // Should transform
      expect(result.code).toContain("{{ $t('message.hello') }}")
      
      // Should preserve JavaScript expressions
      expect(result.code).toContain("{{ user.name || 'Guest' }}")
      expect(result.code).toContain("alert('Debug info')")
      
      // Should preserve existing i18n calls
      expect(result.code).toContain("{{ $t('existing.key') }}")
      expect(result.code).toContain("{{ $tc('message.item', count) }}")
      
      // Should only find 1 match (Hello World)
      expect(result.matches).toHaveLength(1)
    })

    it('should handle conditional and list rendering', async () => {
      const sourceCode = `
<template>
  <div>
    <p v-if="show">Welcome</p>
    <li v-for="item in items">Hello World</li>
    <template #header>
      <h2>Page Title</h2>
    </template>
  </div>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.code).toContain("{{ $t('message.welcome') }}")
      expect(result.code).toContain("{{ $t('message.hello') }}")
      expect(result.code).toContain("{{ $t('message.title') }}")
      expect(result.matches).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid Vue SFC gracefully', async () => {
      const sourceCode = `
<template>
  <div>Hello World
</template>
      `.trim() // Missing closing div tag

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      // Should still attempt transformation and not crash
      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
    })

    it('should handle empty content gracefully', async () => {
      const sourceCode = `
<template>
</template>

<script setup>
</script>
      `.trim()

      const transformer = new VueTransformer(sourceCode, options)
      const result = await transformer.transform()

      expect(result.matches).toHaveLength(0)
      expect(result.code).toContain('<template>')
      expect(result.code).toContain('<script setup>')
    })
  })
}) 
