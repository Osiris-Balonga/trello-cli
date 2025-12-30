import { Command } from 'commander';
import { createAuthCommand } from './commands/auth.js';
import { createInitCommand } from './commands/init.js';
import { createListCommand } from './commands/list.js';
import { createCreateCommand } from './commands/create.js';
import { createMoveCommand } from './commands/move.js';

const program = new Command();

program
  .name('tt')
  .description('Trello CLI - Manage your Trello cards from the terminal')
  .version('1.0.0');

program.addCommand(createAuthCommand());
program.addCommand(createInitCommand());
program.addCommand(createListCommand());
program.addCommand(createCreateCommand());
program.addCommand(createMoveCommand());

program.parse();
