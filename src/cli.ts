import { Command } from 'commander';
import type { OutputConfiguration } from 'commander';
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
import { createDueCommand } from './commands/due.js';
import { createBoardCommand } from './commands/board.js';
import { createDeleteCommand } from './commands/delete.js';
import { createArchiveCommand } from './commands/archive.js';
import { createCommentCommand } from './commands/comment.js';
import { createWatchCommand } from './commands/watch.js';
import { createExportCommand } from './commands/export.js';
import { createStatsCommand } from './commands/stats.js';
import { createTemplateCommand } from './commands/template.js';
import { createBatchCommand } from './commands/batch.js';
import { initI18n, t } from './utils/i18n.js';

await initI18n();

function localizeHelp(output: string): string {
  return output
    .replace(/^Usage: /gm, `${t('cli.usage')} `)
    .replace(/^Options:$/gm, t('cli.optionsTitle'))
    .replace(/^Commands:$/gm, t('cli.commandsTitle'))
    .replace(/^Arguments:$/gm, t('cli.argumentsTitle'))
    .replace(/display help for command/g, t('cli.help'));
}

const localizedOutputConfig: OutputConfiguration = {
  writeOut: (str) => process.stdout.write(localizeHelp(str)),
  writeErr: (str) => process.stderr.write(localizeHelp(str)),
  outputError: (str, write) => write(localizeHelp(str)),
};

function configureCommandOutput(cmd: Command): void {
  cmd.configureOutput(localizedOutputConfig);
  cmd.commands.forEach((subCmd) => configureCommandOutput(subCmd));
}

const program = new Command();

program
  .name('tt')
  .description(t('cli.description'))
  .version('1.0.0', '-V, --version', t('cli.version'))
  .helpOption('-h, --help', t('cli.help'))
  .addHelpCommand('help [command]', t('cli.helpCommand'));

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
program.addCommand(createDueCommand());
program.addCommand(createBoardCommand());
program.addCommand(createDeleteCommand());
program.addCommand(createArchiveCommand());
program.addCommand(createCommentCommand());
program.addCommand(createWatchCommand());
program.addCommand(createExportCommand());
program.addCommand(createStatsCommand());
program.addCommand(createTemplateCommand());
program.addCommand(createBatchCommand());

configureCommandOutput(program);

program.parse();
