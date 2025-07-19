<script setup lang="ts">
import { computed, ref } from 'vue'

// 1. Script transformations - ref with string literal
const title = ref('Hello World')
const greeting = ref('Welcome')

// 2. Script transformations - computed with string literal
const message = computed(() => 'Hello World')
const status = computed(() => 'Loading...')

// 3. Script transformations - array/object literals
const buttons = ['Submit', 'Cancel', 'Confirm']
const formConfig = {
  name: 'Name',
  submit: 'Submit',
  cancel: 'Cancel'
}

// 4. Script transformations - function return values
const getErrorMsg = () => 'Error occurred'
const getSuccessMsg = () => 'Success!'

// 5. Script transformations - nested objects
const messages = {
  primary: 'Hello World',
  secondary: 'Welcome',
  actions: {
    submit: 'Submit',
    cancel: 'Cancel'
  }
}

// 6. Script transformations - array of objects
const menuItems = [
  { label: 'Hello World', action: 'welcome' },
  { label: 'Submit', action: 'submit' }
]
</script>

<template>
  <div class="app">
    <h1>Vue 3 Auto I18n Plugin Demo</h1>
    
    <!-- 1. Template transformations - plain text nodes -->
    <section>
      <h2>Plain Text Transformations</h2>
      <p>Hello World</p>
      <p>Welcome</p>
    </section>

    <!-- 2. Template transformations - attribute values -->
    <section>
      <h2>Attribute Transformations</h2>
      <input placeholder="Name" />
      <button title="Submit">Submit</button>
      <div role="button" aria-label="Cancel">Cancel</div>
    </section>

    <!-- 3. Template transformations - dynamic attribute bindings -->
    <section>
      <h2>Dynamic Attribute Bindings</h2>
      <input :placeholder="'Name'" />
      <button :title="'Submit'">Submit</button>
      <div :aria-label="'Cancel'">Cancel</div>
    </section>

    <!-- 4. Template transformations - interpolation expressions -->
    <section>
      <h2>Interpolation Transformations</h2>
      <p>{{ 'Hello World' }}</p>
      <p>{{ 'Welcome' }}</p>
      <p>{{ 'Loading...' }}</p>
    </section>

    <!-- 5. Script variable usage (already transformed) -->
    <section>
      <h2>Script Variables (Transformed)</h2>
      <p>{{ title }}</p>
      <p>{{ message }}</p>
      <p>{{ status }}</p>
      <p>{{ greeting }}</p>
    </section>

    <!-- 6. Array/Object usage (already transformed) -->
    <section>
      <h2>Array/Object Usage (Transformed)</h2>
      <div>
        <button v-for="btn in buttons" :key="btn">{{ btn }}</button>
      </div>
      <div>
        <label>{{ formConfig.name }}</label>
        <button>{{ formConfig.submit }}</button>
        <button>{{ formConfig.cancel }}</button>
      </div>
    </section>

    <!-- 7. Function calls (already transformed) -->
    <section>
      <h2>Function Calls (Transformed)</h2>
      <p>{{ getErrorMsg() }}</p>
      <p>{{ getSuccessMsg() }}</p>
    </section>

    <!-- 8. Nested objects (already transformed) -->
    <section>
      <h2>Nested Objects (Transformed)</h2>
      <p>{{ messages.primary }}</p>
      <p>{{ messages.secondary }}</p>
      <button>{{ messages.actions.submit }}</button>
      <button>{{ messages.actions.cancel }}</button>
    </section>

    <!-- 9. Array of objects (already transformed) -->
    <section>
      <h2>Array of Objects (Transformed)</h2>
      <ul>
        <li v-for="item in menuItems" :key="item.action">
          {{ item.label }}
        </li>
      </ul>
    </section>

    <!-- 10. Locale switcher -->
    <section>
      <h2>Locale Switcher</h2>
      <div class="locale-changer">
        <label>Language: </label>
        <select v-model="$i18n.locale">
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </section>

    <!-- 11. Transformation info -->
    <section>
      <h2>Transformation Info</h2>
      <p><strong>Note:</strong> All the strings above will be automatically transformed by the plugin:</p>
      <ul>
        <li>Plain text nodes → {{ $t('hello') }}</li>
        <li>Attribute values → :placeholder="$t('name')"</li>
        <li>Dynamic bindings → :title="$t('submit')"</li>
        <li>Interpolations → {{ $t('welcome') }}</li>
        <li>Script variables → ref(t('hello'))</li>
        <li>Array/Objects → [t('submit'), t('cancel')]</li>
      </ul>
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
</style>
