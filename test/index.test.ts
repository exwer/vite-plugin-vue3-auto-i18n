import { describe, expect, test } from 'vitest'
import { start } from '../src/index'

describe('import test', () => {
  test('All absence', async() => {
    expect(await start(`
    <script>
      import { a } from "b"
    </script>`))
      .toMatchInlineSnapshot(`
        "
            <script>import { ref, computed } from \\"vue\\";
        import { useI18n } from \\"vue-i18n\\";
        import { a } from \\"b\\";</script>"
      `)
  })

  test('no ref', async() => {
    expect(await start(`
    <script>
      import {computed} from "vue";
      import {useI18n} from "vue-i18n"
    </script>
    `)).toMatchInlineSnapshot(`
      "
          <script>import { computed, ref } from \\"vue\\";
      import { useI18n } from \\"vue-i18n\\";</script>
          "
    `)
  })

  test('no computed', async() => {
    expect(await start(`
    <script>
      import {ref} from "vue";
      import {useI18n} from "vue-i18n"
    </script>
    `)).toMatchInlineSnapshot(`
      "
          <script>import { ref, computed } from \\"vue\\";
      import { useI18n } from \\"vue-i18n\\";</script>
          "
    `)
  })

  test('no useI18n', async() => {
    expect(await start(`
        <script>
          import {ref,computed} from "vue";import {shit} from "vue-i18n"
        </script>
      `))
      .toMatchInlineSnapshot(`
        "
                <script>import { ref, computed } from \\"vue\\";
        import { shit, useI18n } from \\"vue-i18n\\";</script>
              "
      `)
  })
})

describe('variable test', () => {
  test('no useI18n', async() => {
    expect(await start('<script>const a = "xxx"</script>'))
      .toMatchInlineSnapshot()
  })

  test('no { t }', async() => {
    expect(await start('<script>const { other } = useI18n()</script>'))
      .toMatchInlineSnapshot()
  })
})
