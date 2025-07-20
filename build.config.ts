import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'bin/i18ncraft',
  ],
  declaration: true,
  clean: true,
  failOnWarn: false,
  rollup: {
    emitCJS: true,
    esbuild: {
      target: 'node16',
    },
  },
  // 为CLI工具添加特殊配置
  hooks: {
    'build:done': (ctx) => {
      // 确保CLI文件有执行权限
      if (ctx.buildEntries) {
        for (const entry of ctx.buildEntries) {
          if (entry.path.includes('i18ncraft')) {
            // 在Windows上不需要设置权限
            if (process.platform !== 'win32') {
              const fs = require('node:fs')
              fs.chmodSync(entry.path, '755')
            }
          }
        }
      }
    },
  },
})
