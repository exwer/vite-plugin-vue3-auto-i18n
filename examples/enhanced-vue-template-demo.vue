<template>
  <div class="demo-container">
    <!-- ✅ 基本文本插值 -->
    <h1>Hello World</h1>
    <p>Welcome to our app</p>
    
    <!-- ✅ 静态属性绑定 -->
    <input placeholder="Enter your name" />
    <button title="Submit">Click me</button>
    
    <!-- ✅ 动态属性绑定 -->
    <input :placeholder="'Enter your email'" />
    <button v-bind:title="'Cancel'">Cancel</button>
    <button :[dynamicAttr]="'Loading...'">Dynamic</button>
    
    <!-- ✅ Vue指令中的字符串 -->
    <p v-text="'Hello World'"></p>
    <div v-html="'<strong>Welcome to our app</strong>'"></div>
    
    <!-- ✅ 条件渲染中的文本 -->
    <p v-if="showMessage">Hello World</p>
    <p v-else-if="showWelcome">Welcome to our app</p>
    <p v-else>Loading...</p>
    
    <!-- ✅ 列表渲染中的文本 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        <span>Loading...</span>
        <button>Submit</button>
      </li>
    </ul>
    
    <!-- ✅ 插槽内容 -->
    <my-component>
      <template #header>
        <h2>Hello World</h2>
      </template>
      <template #default>
        <p>Welcome to our app</p>
      </template>
      <template v-slot:footer>
        <button>Submit</button>
      </template>
    </my-component>
    
    <!-- ✅ 组件Props中的复杂表达式 -->
    <my-component 
      title="Hello World"
      :message="'Welcome to our app'"
      :config="{ text: 'Submit', label: 'Cancel' }"
      :items="['Hello World', 'Loading...']"
    />
    
    <!-- ✅ 自闭合标签 -->
    <input placeholder="Enter your name" />
    <img alt="Hello World" src="/image.jpg" />
    <hr />
    
    <!-- ❌ 不会被转换的JavaScript表达式（正确行为）-->
    <p>{{ user.name || 'Guest' }}</p>
    <button @click="alert('Hello World')">Debug</button>
    <input :value="getValue('default')" />
    
    <!-- ✅ 保留已存在的$t调用 -->
    <p>{{ $t('existing.key') }}</p>
    <span>{{ $tc('message.item', count) }}</span>
    
    <!-- ✅ i18n-t组件兼容 -->
    <i18n-t keypath="message.welcome" tag="p">
      <template #name>
        <strong>Hello World</strong>
      </template>
    </i18n-t>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showMessage = ref(true)
const showWelcome = ref(false)
const items = ref([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
])
const user = ref({ name: 'John' })
const count = ref(5)
const dynamicAttr = ref('data-tooltip')

function getValue(defaultValue) {
  return defaultValue
}

function handleClick() {
  console.log('Button clicked')
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1, h2 {
  color: #2c3e50;
}

input, button {
  margin: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #3498db;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #2980b9;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 10px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}
</style> 
