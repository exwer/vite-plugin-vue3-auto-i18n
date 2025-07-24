import { defineConfig } from 'tsup'

export default defineConfig([
  // 库构建
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: [
      'unplugin',
      '@babel/core',
      '@babel/types',
      '@babel/parser', 
      '@babel/traverse',
      '@babel/generator',
      '@vue/compiler-sfc',
      '@vue/compiler-dom',
      'recast',
      'magic-string'
    ]
  },
  // CLI构建
  {
    entry: ['bin/i18ncraft.ts'],
    format: ['cjs'],
    clean: false,
    external: [
      'unplugin',
      '@babel/core',
      '@babel/types',
      '@babel/parser', 
      '@babel/traverse',
      '@babel/generator',
      '@vue/compiler-sfc',
      '@vue/compiler-dom',
      'recast',
      'magic-string'
    ]
  }
]) 
