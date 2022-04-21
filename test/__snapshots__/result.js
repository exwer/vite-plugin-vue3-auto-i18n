import { defineComponent as _defineComponent } from 'vue'
import { computed, ref } from 'vue'
import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, renderList as _renderList, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock, vModelSelect as _vModelSelect, withDirectives as _withDirectives } from "vue"
import { useI18n } from 'vue-i18n'

export default /*#__PURE__*/_defineComponent({
  setup(__props, { expose }) {
    expose();

    const { t } = useI18n()
    const hi = ref(t('message.hi'))
    const arr = ref([
      {
        hi: computed(() => t('message.hi')),
        hello: computed(() => t('message.hello')),
      },
    ])
    const hiFunc = () => computed(() => t('message.hi'))

    const __returned__ = { t, hi, arr, hiFunc }
    Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
    return __returned__
  }

})

const _hoisted_1 = { class: "locale-changer" }
const _hoisted_2 = ["value"]

export function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock(_Fragment, null, [
    _createElementVNode("div", null, _toDisplayString(_ctx.$t('message.hello')), 1 /* TEXT */),
    _createElementVNode("div", null, _toDisplayString(_ctx.hi), 1 /* TEXT */),
    _createElementVNode("ul", null, [
      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.arr, (item) => {
        return (_openBlock(), _createElementBlock("li", {
          key: item.hi
        }, [
          _createElementVNode("p", null, _toDisplayString(item.hello), 1 /* TEXT */),
          _createElementVNode("p", null, _toDisplayString(item.hi), 1 /* TEXT */)
        ]))
      }), 128 /* KEYED_FRAGMENT */))
    ]),
    _createElementVNode("div", null, _toDisplayString(_ctx.hiFunc()), 1 /* TEXT */),
    _createElementVNode("div", _hoisted_1, [
      _withDirectives(_createElementVNode("select", {
        "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.$i18n.locale) = $event))
      }, [
        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.$i18n.availableLocales, (locale) => {
          return (_openBlock(), _createElementBlock("option", {
            key: `locale-${locale}`,
            value: locale
          }, _toDisplayString(locale), 9 /* TEXT, PROPS */, _hoisted_2))
        }), 128 /* KEYED_FRAGMENT */))
      ], 512 /* NEED_PATCH */), [
        [_vModelSelect, _ctx.$i18n.locale]
      ])
    ])
  ], 64 /* STABLE_FRAGMENT */))
}