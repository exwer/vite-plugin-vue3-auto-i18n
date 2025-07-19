# Vue 3 Auto I18n Plugin Example

This example demonstrates all the features of the `vite-plugin-vue3-auto-i18n` plugin.

## Features Demonstrated

### 1. Script Transformations
- **ref with string literals**: `ref('Hello World')` → `ref(t('hello'))`
- **computed with string literals**: `computed(() => 'Loading...')` → `computed(() => t('loading'))`
- **array/object literals**: `['Submit', 'Cancel']` → `[t('submit'), t('cancel')]`
- **nested objects**: `{ primary: 'Hello World' }` → `{ primary: t('hello') }`
- **function return values**: `() => 'Error occurred'` → `() => t('error')`

### 2. Template Transformations
- **plain text nodes**: `Hello World` → `{{ $t('hello') }}`
- **attribute values**: `placeholder="Name"` → `:placeholder="$t('name')"`
- **dynamic bindings**: `:title="'Submit'"` → `:title="$t('submit')"`
- **interpolation expressions**: `{{ 'Welcome' }}` → `{{ $t('welcome') }}`

### 3. Plugin Configuration
- **enableScript**: Enable script transformation
- **enableTemplate**: Enable template transformation
- **exclude**: Exclude specific files/patterns
- **customMatcher**: Custom matching logic
- **keyGenerator**: Automatic key generation
- **debug**: Debug mode for detailed logging

## How to Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to `http://localhost:3000`

## What You'll See

The example page shows:
- **Before/After transformations**: See how strings are automatically converted
- **All transformation types**: Script, template, attributes, interpolations
- **Locale switching**: Switch between English and Chinese
- **Real-time updates**: Watch transformations happen in real-time

## Configuration Details

The `vite.config.ts` file shows how to configure the plugin with all available options:

```typescript
autoI18n(locale, {
  enableScript: true,        // Enable script transformations
  enableTemplate: true,      // Enable template transformations
  exclude: [                 // Exclude patterns
    'node_modules',
    /\.test\.vue$/,
    'src/components/legacy'
  ],
  customMatcher: (text) => { // Custom matching logic
    if (text === 'Hello World') return 'custom.hello'
    return false
  },
  keyGenerator: (text) => {  // Auto key generation
    return `auto.${text.toLowerCase().replace(/\s+/g, '_')}`
  },
  debug: true                // Enable debug logging
})
```

## Language Pack

The example uses a simple language pack with 9 strings:
- `hello`, `welcome`, `name`, `submit`, `loading`
- `error`, `success`, `cancel`, `confirm`

This demonstrates how the plugin can work with any size language pack.

## Expected Transformations

When you run the example, you should see:
1. All hardcoded strings automatically replaced with i18n calls
2. Console logs showing transformation details (debug mode)
3. Language switching working seamlessly
4. No manual i18n setup required in components

This example serves as both a demonstration and a testing ground for the plugin's capabilities. 
