import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { withBoardContext } from '../utils/command-context.js';
import { displayCardsByList } from '../utils/display.js';
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
        await withBoardContext(async ({ cache, client, boardId, lists }) => {
          const cards = await client.cards.listByBoard(boardId);
          const currentMemberId = cache.getCurrentMemberId();

          spinner.succeed(t('list.loaded'));

          logger.print(chalk.bold(`\n${cache.getBoardName()}`));

          if (options.all) {
            displayCardsByList(cards, lists, { cache, isFiltered: false });
          } else if (currentMemberId) {
            displayCardsByList(cards, lists, {
              memberId: currentMemberId,
              cache,
              isFiltered: true,
            });
          } else {
            displayCardsByList(cards, lists, { cache, isFiltered: false });
          }
        });
      } catch (error) {
        spinner.fail(t('list.failed'));
        handleCommandError(error);
      }
    });

  return list;
}
