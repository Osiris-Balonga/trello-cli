import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

export function createMoveCommand(): Command {
  const move = new Command('move');

  move
    .description(t('cli.commands.move'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .argument('[list]', t('cli.arguments.list'))
    .action(async (cardNumberStr: string, listAlias: string | undefined) => {
      try {
        const cache = await loadCache();
        const client = await createTrelloClient();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(
            'No board configured. Run "tt init" first.',
            'NOT_INITIALIZED'
          );
        }

        const spinner = ora('Loading cards...').start();
        const cards = await client.cards.listByBoard(boardId);
        spinner.stop();

        const cardNumber = parseInt(cardNumberStr, 10);
        if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
          throw new TrelloValidationError(
            `Invalid card number. Must be between 1 and ${cards.length}.`,
            'cardNumber'
          );
        }

        const card = cards[cardNumber - 1];

        let targetList = listAlias;
        if (!targetList) {
          targetList = await select({
            message: `Move "${card.name}" to:`,
            choices: [
              { name: '📝 To Do', value: 'todo' },
              { name: '🔄 Doing', value: 'doing' },
              { name: '✅ Done', value: 'done' },
            ],
          });
        }

        const list = cache.getListByAlias(targetList);
        if (!list) {
          throw new TrelloError(
            `List "${targetList}" not found in cache. Run "tt init" to refresh.`,
            'LIST_NOT_FOUND'
          );
        }

        const moveSpinner = ora(`Moving to ${list.name}...`).start();
        await client.cards.move(card.id, list.id);

        moveSpinner.succeed(`✓ "${card.name}" → ${list.name}`);
        console.log(chalk.gray(`URL: ${card.shortUrl}`));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return move;
}
