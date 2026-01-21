import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { withBoardContext } from '../utils/command-context.js';
import { displayTasksByColumn } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface ListOptions {
  all?: boolean;
}

export function createListCommand(): Command {
  const list = new Command('list');

  list
    .description(t('cli.commands.list'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (options: ListOptions) => {
      const spinner = ora(t('list.loading')).start();

      try {
        await withBoardContext(async ({ cache, provider, boardId, columns }) => {
          const tasks = await provider.listTasks(boardId);
          const currentMemberId = cache.getCurrentMemberId();

          spinner.succeed(t('list.loaded'));

          logger.print(chalk.bold(`\n${cache.getBoardName()}`));

          if (options.all) {
            displayTasksByColumn(tasks, columns, { cache, isFiltered: false });
          } else if (currentMemberId) {
            displayTasksByColumn(tasks, columns, {
              memberId: currentMemberId,
              cache,
              isFiltered: true,
            });
          } else {
            displayTasksByColumn(tasks, columns, { cache, isFiltered: false });
          }
        });
      } catch (error) {
        spinner.fail(t('list.failed'));
        handleCommandError(error);
      }
    });

  return list;
}
