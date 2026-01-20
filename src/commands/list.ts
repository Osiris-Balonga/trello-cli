import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { displayCardsByList } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
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
        const cache = await loadCache();
        const client = await createTrelloClient();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(t('list.errors.boardNotFound'), 'INVALID_CACHE');
        }

        const cards = await client.cards.listByBoard(boardId);
        const lists = cache.getAllLists();
        const currentMemberId = cache.getCurrentMemberId();

        spinner.succeed(t('list.loaded'));

        logger.print(chalk.bold(`\n${cache.getBoardName()}`));

        if (options.all) {
          displayCardsByList(cards, lists, { cache, isFiltered: false });
        } else if (currentMemberId) {
          displayCardsByList(cards, lists, { memberId: currentMemberId, cache, isFiltered: true });
        } else {
          displayCardsByList(cards, lists, { cache, isFiltered: false });
        }
      } catch (error) {
        spinner.fail(t('list.failed'));
        handleCommandError(error);
      }
    });

  return list;
}
