// 自定义转换格式配置示例

// 1. Vue + vue-i18n (默认格式)
const vueI18nFormat = {
  template: (key) => `$t('${key}')`,
  script: (key) => `computed(() => $t('${key}'))`,
  interpolation: (key) => `$t('${key}')`
}

// 2. Vue + i18next
const vueI18nextFormat = {
  template: (key) => `$t('${key}')`,
  script: (key) => `computed(() => $t('${key}'))`,
  interpolation: (key) => `$t('${key}')`
}

// 3. React + react-i18next
const reactI18nextFormat = {
  template: (key) => `{t('${key}')}`,
  script: (key) => `useMemo(() => t('${key}'), [t])`,
  interpolation: (key) => `t('${key}')`
}

// 4. Svelte + svelte-i18n
const svelteI18nFormat = {
  template: (key) => `$_('${key}')`,
  script: (key) => `derived(() => $_('${key}'))`,
  interpolation: (key) => `$_('${key}')`
}

// 5. 自定义格式
const customFormat = {
  template: (key) => `i18n.get('${key}')`,
  script: (key) => `reactive(() => i18n.get('${key}'))`,
  interpolation: (key) => `i18n.get('${key}')`
}

// 6. 字符串模板格式
const stringTemplateFormat = {
  template: 'i18n.t("{{key}}")',
  script: 'computed(() => i18n.t("{{key}}"))',
  interpolation: 'i18n.t("{{key}}")'
}

// 使用示例
const config = {
  locale: {
    default: 'en',
    messages: {
      en: {
        hello: 'Hello',
        welcome: 'Welcome, {{name}}!'
      },
      zh: {
        hello: '你好',
        welcome: '欢迎，{{name}}！'
      }
    }
  },
  // 选择转换格式
  transformFormat: vueI18nFormat // 或 reactI18nextFormat, svelteI18nFormat 等
}

module.exports = {
  vueI18nFormat,
  vueI18nextFormat,
  reactI18nextFormat,
  svelteI18nFormat,
  customFormat,
  stringTemplateFormat,
  config
} 
