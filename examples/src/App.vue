<script setup lang="ts">
import { ref } from 'vue'

// 这些字符串将被插件自动转换为 t('hello'), t('welcome') 等
const title = ref('Hello World')
const greeting = ref('Welcome')
const buttons = ['Submit', 'Cancel']
</script>

<template>
  <div class="app">
    <h1>Vue 3 Auto I18n Plugin Demo</h1>
    
    <!-- 这些文本将被插件自动转换为 {{ $t('hello') }}, {{ $t('welcome') }} 等 -->
    <section>
      <h2>Template Text Transformations</h2>
      <p>Hello World</p>
      <p>Welcome</p>
      <p>Loading...</p>
    </section>

    <!-- 这些属性将被插件自动转换为 :placeholder="$t('name')" 等 -->
    <section>
      <h2>Attribute Transformations</h2>
      <input placeholder="Name" />
      <button title="Submit">Submit</button>
      <button title="Cancel">Cancel</button>
    </section>

    <!-- 这些动态绑定将被插件自动转换 -->
    <section>
      <h2>Dynamic Binding Transformations</h2>
      <input :placeholder="'Name'" />
      <button :title="'Submit'">Submit</button>
    </section>

    <!-- 这些插值表达式将被插件自动转换 -->
    <section>
      <h2>Interpolation Transformations</h2>
      <p>{{ 'Hello World' }}</p>
      <p>{{ 'Welcome' }}</p>
    </section>

    <!-- 这些脚本变量已经被插件转换 -->
    <section>
      <h2>Script Variables (Already Transformed)</h2>
      <p>{{ title }}</p>
      <p>{{ greeting }}</p>
      <div>
        <button v-for="btn in buttons" :key="btn">{{ btn }}</button>
      </div>
    </section>

    <!-- 语言切换器 -->
    <section>
      <h2>Language Switcher</h2>
      <div class="locale-changer">
        <label>Current Language: </label>
        <select v-model="$i18n.locale">
          <option value="zh">中文 (Chinese)</option>
          <option value="en">English</option>
        </select>
      </div>
      <p><strong>Current locale:</strong> {{ $i18n.locale }}</p>
    </section>

    <!-- 说明 -->
    <section>
      <h2>How It Works</h2>
      <p><strong>Original Code:</strong></p>
      <ul>
        <li><code>&lt;p&gt;Hello World&lt;/p&gt;</code></li>
        <li><code>const title = ref('Hello World')</code></li>
        <li><code>placeholder="Name"</code></li>
      </ul>
      <p><strong>After Plugin Transformation:</strong></p>
      <ul>
        <li><code>&lt;p&gt;{{ $t('hello') }}&lt;/p&gt;</code></li>
        <li><code>const title = ref(t('hello'))</code></li>
        <li><code>:placeholder="$t('name')"</code></li>
      </ul>
      <p><strong>Result:</strong> All English text is automatically converted to Chinese when locale is 'zh'</p>
    </section>
  </div>
</template>

<style scoped>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: #f9f9f9;
}

h1 {
  color: #333;
  text-align: center;
}

h2 {
  color: #666;
  margin-top: 0;
}

input, button {
  margin: 5px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

button {
  background: #007bff;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

.locale-changer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

ul {
  margin: 10px 0;
  padding-left: 20px;
}

li {
  margin: 5px 0;
}

code {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
