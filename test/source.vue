<script setup lang="ts">
import { ref } from 'vue'
const hi = ref('hi')
const arr = ref([
  {
    hi: 'hi',
    hello: 'hello',
  },
])
const hiFunc = () => 'hi'
</script>

<template>
  <div>hello</div>
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
