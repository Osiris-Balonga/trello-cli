import { Command } from 'commander';
import { createAuthCommand } from './commands/auth.js';
import { createInitCommand } from './commands/init.js';
import { createListCommand } from './commands/list.js';
import { createCreateCommand } from './commands/create.js';
import { createMoveCommand } from './commands/move.js';
import { createShowCommand } from './commands/show.js';
import { createUpdateCommand } from './commands/update.js';
import { createMembersCommand } from './commands/members.js';
import { createLabelsCommand } from './commands/labels.js';
import { createConfigCommand } from './commands/config.js';
import { createSyncCommand } from './commands/sync.js';
import { createSearchCommand } from './commands/search.js';
import { initI18n } from './utils/i18n.js';

await initI18n();

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
program.addCommand(createShowCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createMembersCommand());
program.addCommand(createLabelsCommand());
program.addCommand(createConfigCommand());
program.addCommand(createSyncCommand());
program.addCommand(createSearchCommand());

program.parse();
