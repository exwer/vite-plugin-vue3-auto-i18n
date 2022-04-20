<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const hi = ref(computed(() => t('message.hi')))
const arr = ref([
  {
    hi: computed(() => t('message.hi')),
    hello: computed(() => t('message.hello')),
  },
])
const hiFunc = () => computed(() => t('message.hi'))
</script>

<template>
  <div>{{ t("message.hello") }}</div>
  <div>{{ hi }}</div>
  <ul>
    <li v-for="item in arr" :key="item.hi">
      <p>{{ item.hello }}</p>
      <p>{{ item.hi }}</p>
    </li>
  </ul>
  <div>{{ hiFunc() }}</div>
  <div class="locale-changer">
    <select v-model="$i18n.locale">
      <option
        v-for="locale in $i18n.availableLocales"
        :key="`locale-${locale}`"
        :value="locale"
      >
        {{ locale }}
      </option>
    </select>
  </div>
</template>

<style lang="scss"></style>
