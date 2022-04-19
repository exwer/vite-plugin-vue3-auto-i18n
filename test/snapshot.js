import { defineComponent as _defineComponent, ref } from 'vue'

export default /* #__PURE__ */_defineComponent({
  setup(__props, { expose }) {
    expose()

    const hi = ref('hi')
    const arr = ref([
      {
        hi: 'hi',
        hello: 'hello',
      },
    ])
    const hiFunc = () => 'hi'

    const __returned__ = { hi, arr, hiFunc }
    Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
    return __returned__
  },

})
