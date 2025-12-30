import { Command } from 'commander';
import { createAuthCommand } from './commands/auth.js';

const program = new Command();

program
  .name('tt')
  .description('Trello CLI - Manage your Trello cards from the terminal')
  .version('1.0.0');

program.addCommand(createAuthCommand());

program.parse();
