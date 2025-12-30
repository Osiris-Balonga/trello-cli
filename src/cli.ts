import { Command } from 'commander';
import { createAuthCommand } from './commands/auth.js';
import { createInitCommand } from './commands/init.js';
import { createListCommand } from './commands/list.js';

const program = new Command();

program
  .name('tt')
  .description('Trello CLI - Manage your Trello cards from the terminal')
  .version('1.0.0');

program.addCommand(createAuthCommand());
program.addCommand(createInitCommand());
program.addCommand(createListCommand());

program.parse();
