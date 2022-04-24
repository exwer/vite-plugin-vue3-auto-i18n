import { describe, expect, test } from 'vitest'
import { start } from '../src/index'

describe('import test', () => {
  test('All absence', async() => {
    expect(await start(`
    <script setup>
      import { a } from "b"
    </script>`))
      .toMatchInlineSnapshot(`
        "
            <script setup>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        import { a } from \\"b\\";</script>"
      `)
  })

  test('no ref', async() => {
    expect(await start(`
    <script setup>
      import {computed} from "vue";
      import {useI18n} from "vue-i18n"
    </script>
    `)).toMatchInlineSnapshot(`
      "
          <script setup>import { computed, ref } from \\"vue\\";
      import { useI18n } from \\"vue-i18n\\";</script>
          "
    `)
  })

  test('no computed', async() => {
    expect(await start(`
    <script setup>
      import {ref} from "vue";
      import {useI18n} from "vue-i18n"
    </script>
    `)).toMatchInlineSnapshot(`
      "
          <script setup>import { ref, computed } from \\"vue\\";
      import { useI18n } from \\"vue-i18n\\";</script>
          "
    `)
  })

  test('no useI18n', async() => {
    expect(await start(`
        <script setup>
          import {ref,computed} from "vue";import {shit} from "vue-i18n"
        </script>
      `))
      .toMatchInlineSnapshot(`
        "
                <script setup>import { ref, computed } from \\"vue\\";
        import { shit, useI18n } from \\"vue-i18n\\";</script>
              "
      `)
  })
})

describe('variable test', () => {
  test('no useI18n', async() => {
    expect(await start(`
      <script setup>
        const a = "xxx"
      </script>
    `))
      .toMatchInlineSnapshot()
  })

  test('no useI18n(inside setup)', async() => {
    expect(await start(`
      <script>
      export default{
        setup(){
          const a = "xxx"
        }
      }
      </script>
    `))
      .toMatchInlineSnapshot()
  })

  test('no { t }', async() => {
    expect(await start(`
      <script setup>
        const { other } = useI18n()
      </script>
    `))
      .toMatchInlineSnapshot()
  })

  test('no { t }(inside setup)', async() => {
    expect(await start(`
    <script>
    export default{
      setup(){
        const { other } = useI18n()
      }
    }
    </script>
    `))
      .toMatchInlineSnapshot()
  })
})
