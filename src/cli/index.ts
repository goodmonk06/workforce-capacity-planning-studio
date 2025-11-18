#!/usr/bin/env node

import { Command } from 'commander'
import { seedCommand } from './commands/seed'
import { simulateCommand } from './commands/simulate'
import { exportCommand } from './commands/export'
import { analyzeCommand } from './commands/analyze'
import { migrateCommand } from './commands/migrate'

const program = new Command()

program
  .name('capacity-cli')
  .description('Workforce Capacity Planning Studio CLI')
  .version('1.0.0')

// Register commands
program.addCommand(seedCommand)
program.addCommand(simulateCommand)
program.addCommand(exportCommand)
program.addCommand(analyzeCommand)
program.addCommand(migrateCommand)

program.parse()
