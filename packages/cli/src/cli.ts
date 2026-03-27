#!/usr/bin/env node

import { Command } from 'commander'
import { importCommand } from './commands/import'
import { viewCommand } from './commands/view'
import { validateCommand } from './commands/validate'
import { exportCommand } from './commands/export'
import { initCommand } from './commands/init'
import { infoCommand } from './commands/info'

const program = new Command()

program
  .name('state')
  .description('CLI tool for .agent files - Portable AI conversation format')
  .version('0.1.0')

// Register commands
program.addCommand(importCommand)
program.addCommand(viewCommand)
program.addCommand(validateCommand)
program.addCommand(exportCommand)
program.addCommand(initCommand)
program.addCommand(infoCommand)

// Parse arguments
program.parseAsync(process.argv)
  .catch((error) => {
    console.error('Error:', error.message)
    process.exit(1)
  })
