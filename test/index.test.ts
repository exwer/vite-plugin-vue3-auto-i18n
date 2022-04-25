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
        const {
          t
        } = useI18n();
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
      const {
        t
      } = useI18n();
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
      const {
        t
      } = useI18n();
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
        const {
          t
        } = useI18n();
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
      .toMatchInlineSnapshot(`
        "
              <script setup>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        const {
          t
        } = useI18n();
        const a = \\"xxx\\";</script>
            "
      `)
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
      .toMatchInlineSnapshot(`
        "
              <script>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        export default {
          setup() {
            const {
              t
            } = useI18n();
            const a = \\"xxx\\";
          }
        
        };</script>
            "
      `)
  })

  test('no { t }', async() => {
    expect(await start(`
      <script setup>
        const { other } = useI18n()
      </script>
    `))
      .toMatchInlineSnapshot(`
        "
              <script setup>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        const {
          t
        } = useI18n();
        const {
          other
        } = useI18n();</script>
            "
      `)
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
      .toMatchInlineSnapshot(`
        "
            <script>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        export default {
          setup() {
            const {
              t
            } = useI18n();
            const {
              other
            } = useI18n();
          }
        
        };</script>
            "
      `)
  })
})
