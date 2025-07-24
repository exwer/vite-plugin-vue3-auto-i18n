# i18nCraft 🚀

> 🌍 Professional internationalization automation tool with intelligent batch text transformation and enterprise-grade error handling.

[![NPM version](https://img.shields.io/npm/v/i18ncraft.svg)](https://npmjs.com/package/i18ncraft)
[![License](https://img.shields.io/npm/l/i18ncraft.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Smart Text Recognition** - Advanced pattern matching with intelligent text extraction
- 🔧 **Multi-Framework Support** - Vue.js, React, and vanilla JavaScript projects
- 🚀 **Enhanced Vue Template Support** - Comprehensive Vue syntax compatibility including directives, dynamic attributes, and complex expressions
- 🧩 **Modular Architecture** - Extensible transformer and provider system
- 📦 **Multiple Integration Options** - CLI, programmatic API, and build tool plugins
- 🛡️ **Enterprise-Grade Error Handling** - Comprehensive error recovery and reporting
- ⚡ **High Performance** - Optimized string matching with intelligent caching
- 🎨 **Flexible Configuration** - Customizable transformation rules and output formats

## 🚀 Quick Start

### Installation

```bash
npm install i18ncraft
# or
pnpm add i18ncraft
# or
yarn add i18ncraft
```

### Basic Usage

#### Vue.js Projects

**Before transformation:**
```vue
<template>
  <div class="app">
    <h1>Hello World</h1>
    <p>Welcome to our app</p>
    <input placeholder="Enter your name" />
    <button :title="'Click to submit'">Submit</button>
    <div v-text="'Loading...'"></div>
    <my-component :config="{ text: 'Save', label: 'Cancel' }" />
  </div>
</template>

<script setup>
const message = 'Hello World'
const buttonText = 'Click me'
</script>
```

**After transformation:**
```vue
<template>
  <div class="app">
    <h1>{{ $t('message.hello') }}</h1>
    <p>{{ $t('message.welcome') }}</p>
    <input :placeholder="$t('message.placeholder')" />
    <button :title="$t('message.submit')">{{ $t('message.submit') }}</button>
    <div v-text="$t('message.loading')"></div>
    <my-component :config="{ text: $t('message.save'), label: $t('message.cancel') }" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ✅ Optimized: Only top-level variables wrapped with computed()
// Inner strings use simple t() calls for better performance
const message = computed(() => t('message.hello'))
const buttonText = computed(() => t('message.clickMe'))
</script>
```

**Programmatic usage:**
```typescript
import { VueTransformer } from 'i18ncraft'

const transformer = new VueTransformer(sourceCode, {
  locale: {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome to our app',
        placeholder: 'Enter your name',
        submit: 'Click to submit',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        clickMe: 'Click me'
      }
    }
  }
})

const result = await transformer.transform()
console.log(result.code) // Transformed code
console.log(result.matches) // Found translations
```

#### React Projects

**Before transformation:**
```jsx
import React from 'react'

function App() {
  const [title] = useState('Hello World')
  
  return (
    <div className="app">
      <h1>{title}</h1>
      <p>Welcome to our app</p>
        <input placeholder="Enter your name" />
          <button>Submit</button>
      <div>Loading...</div>
    </div>
  )
}
```

**After transformation:**
```jsx
import React from 'react'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()
  const [title] = useState(t('message.hello'))
  
  return (
    <div className="app">
      <h1>{title}</h1>
      <p>{t('message.welcome')}</p>
      <input placeholder={t('message.placeholder')} />
      <button>{t('message.submit')}</button>
      <div>{t('message.loading')}</div>
    </div>
  )
}
```

**Programmatic usage:**
```typescript
import { ReactTransformer } from 'i18ncraft'

const transformer = new ReactTransformer(sourceCode, {
  locale: {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome to our app',
        placeholder: 'Enter your name',
          submit: 'Submit',
        loading: 'Loading...'
        }
      }
  }
})

const result = await transformer.transform()
```

#### Vanilla JavaScript

**Before transformation:**
```javascript
const messages = {
  greeting: 'Hello World',
  farewell: 'Goodbye'
}

function showMessage() {
  alert('Welcome to our app')
  console.log('Debug: User logged in')
}
```

**After transformation:**
```javascript
const messages = {
  greeting: translate('message.hello'),
  farewell: translate('message.goodbye')
}

function showMessage() {
  alert(translate('message.welcome'))
  console.log('Debug: User logged in')
}
```

**Programmatic usage:**
```typescript
import { JavaScriptTransformer } from 'i18ncraft'

const transformer = new JavaScriptTransformer(sourceCode, {
      locale: {
        en: {
          message: {
            hello: 'Hello World',
        goodbye: 'Goodbye',
        welcome: 'Welcome to our app'
          }
        }
      }
    })

const result = await transformer.transform()
```

### CLI Usage

```bash
# Transform Vue files
i18ncraft transform --input src --output dist --locale ./locales/en.json

# Batch process with custom configuration
i18ncraft transform --config ./i18n.config.js
```

**Example output:**
```bash
$ i18ncraft transform --input src --output dist

✨ i18nCraft - Transforming your project...

📁 Processing src/
  ✅ components/Header.vue (3 matches found)
  ✅ components/Button.vue (2 matches found) 
  ✅ pages/Home.vue (8 matches found)
  ✅ utils/messages.js (5 matches found)

🎉 Transformation completed!
  📊 Files processed: 4
  🔍 Total matches: 18 translations found
  ⚡ Time taken: 1.2s
  📂 Output: dist/
```

## 🎯 Vue Template Support

i18nCraft provides comprehensive Vue template transformation support:

### ✅ Fully Supported Syntax

**Input:**
```vue
<template>
  <!-- Basic text interpolation -->
  <h1>Hello World</h1>
  
  <!-- Static attributes -->
  <input placeholder="Enter your name" />
  
  <!-- Dynamic attributes -->
  <input :placeholder="'Enter your email'" />
  <button :[dynamicAttr]="'Submit'">Click</button>
  
  <!-- Vue directives -->
  <p v-text="'Hello World'"></p>
  <div v-html="'<strong>Welcome</strong>'"></div>
  
  <!-- Component props with complex expressions -->
  <my-component 
    :config="{ text: 'Hello', label: 'Submit' }"
    :items="['Loading...', 'Success!']"
  />
  
  <!-- Conditional rendering -->
  <p v-if="show">Welcome message</p>
  
  <!-- List rendering -->
  <li v-for="item in items">Item text</li>
  
  <!-- Slots -->
  <template #header>
    <h2>Page Title</h2>
  </template>
</template>
```

**Output:**
```vue
<template>
  <!-- Basic text interpolation -->
  <h1>{{ $t('message.hello') }}</h1>
  
  <!-- Static attributes -->
  <input :placeholder="$t('message.placeholder')" />
  
  <!-- Dynamic attributes -->
  <input :placeholder="$t('message.email')" />
  <button :[dynamicAttr]="$t('message.submit')">Click</button>
  
  <!-- Vue directives -->
  <p v-text="$t('message.hello')"></p>
  <div v-html="$t('message.welcome')"></div>
  
  <!-- Component props with complex expressions -->
  <my-component 
    :config="{ text: $t('message.hello'), label: $t('message.submit') }"
    :items="[$t('message.loading'), $t('message.success')]"
  />
  
  <!-- Conditional rendering -->
  <p v-if="show">{{ $t('message.welcome') }}</p>
  
  <!-- List rendering -->
  <li v-for="item in items">{{ $t('message.item') }}</li>
  
  <!-- Slots -->
  <template #header>
    <h2>{{ $t('message.title') }}</h2>
  </template>
</template>
```

### 🛡️ Intelligently Skipped

```vue
<template>
  <!-- JavaScript expressions (correctly preserved) -->
  <p>{{ user.name || 'Guest' }}</p>
  <button @click="alert('Debug info')">Debug</button>
  
  <!-- Existing i18n calls (preserved) -->
  <p>{{ $t('existing.key') }}</p>
  <span>{{ $tc('message.item', count) }}</span>
</template>
```

## 🏗️ Architecture

i18nCraft follows a modular architecture with clear separation of concerns:

```
src/
├── core/
│   ├── transformer/        # Base transformer classes
│   │   ├── base.ts         # Abstract base transformer
│   │   ├── vue.ts          # Vue-specific transformer
│   │   ├── react.ts        # React-specific transformer
│   │   └── javascript.ts   # Vanilla JS transformer
│   ├── providers/          # i18n library adapters
│   │   ├── vue-i18n.ts     # Vue I18n provider
│   │   ├── react-i18next.ts # React i18next provider
│   │   └── vanilla-js.ts   # Vanilla JS providers
│   ├── parsers/            # AST parsing utilities
│   │   └── recast-parser.ts # JavaScript AST parser
│   ├── middleware/         # Processing middleware
│   └── matcher.ts          # Text matching engine
├── plugins/                # Build tool integrations
├── cli/                    # Command-line interface
└── types/                  # TypeScript definitions
```

## 🔧 Configuration

### Transform Options

```typescript
interface TransformOptions {
  locale: LocaleConfig        // Locale configuration
  provider?: I18nProvider     // Optional custom provider
}
```

### CLI Configuration

```javascript
// i18n.config.js
export default {
  scanDir: './src',
  outDir: './dist',
  exts: ['.vue', '.js', '.ts', '.jsx', '.tsx'],
      locale: {
        en: {
      // Your locale messages
          }
        }
}
```

## 🧩 Custom Providers

Create custom i18n providers for different libraries:

```typescript
import { I18nProvider } from 'i18ncraft'

const customProvider: I18nProvider = {
  createTranslationAst: (key: string) => {
    // Return AST node for your i18n library
    return t.callExpression(
      t.identifier('translate'),
      [t.stringLiteral(key)]
    )
  }
}
```

## 📊 Performance

- **Smart Caching**: Intelligent caching of matched strings and transformations
- **Single Pass**: Each transformation type processes content only once
- **Optimized Regex**: Carefully crafted regular expressions for maximum efficiency
- **Memory Efficient**: Minimal memory footprint with streaming processing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/exwer/i18ncraft.git
cd i18ncraft

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the project
pnpm build
```

## 📄 License

MIT © [exwer](https://github.com/exwer)

## 🙏 Acknowledgments

- Vue.js team for the excellent compiler tools
- React team for the transformation inspiration
- The i18n community for valuable feedback and contributions

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/exwer">exwer</a></sub>
</div> 
