import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { displayCardsByList } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';

export function createListCommand(): Command {
  const list = new Command('list');

  list
    .description('List all cards from the board')
    .action(async () => {
      const spinner = ora('Loading cards...').start();

      try {
        const cache = await loadCache();
        const client = await createTrelloClient();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError('Board ID not found in cache', 'INVALID_CACHE');
        }

        const cards = await client.cards.listByBoard(boardId);

        spinner.succeed('Cards loaded');

        console.log(chalk.bold(`\n${cache.getBoardName()}`));
        displayCardsByList(cards, cache.getLists());
      } catch (error) {
        spinner.fail('Failed to load cards');
        handleCommandError(error);
      }
    });

  return list;
}
