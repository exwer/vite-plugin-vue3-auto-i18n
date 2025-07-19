#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('auto-i18n')
  .description('Auto i18n CLI tool for Vue projects')
  .version('0.1.0')

program
  .command('scan <dir>')
  .description('Scan and transform files for i18n')
  .option('--dry-run', 'Only print the changes, do not write files')
  .action((dir, options) => {
    console.log('Scan dir:', dir)
    if (options.dryRun) {
      console.log('Dry run mode enabled')
    }
    // TODO: 调用核心转换逻辑
  })

program.parse(process.argv) 
