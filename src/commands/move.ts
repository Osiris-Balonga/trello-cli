import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

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
            t('move.errors.notInitialized'),
            'NOT_INITIALIZED'
          );
        }

        const spinner = ora(t('move.loading')).start();
        const cards = await client.cards.listByBoard(boardId);
        spinner.stop();

        const cardNumber = parseInt(cardNumberStr, 10);
        if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
          throw new TrelloValidationError(
            t('move.errors.invalidCard', { max: cards.length }),
            'cardNumber'
          );
        }

        const card = cards[cardNumber - 1];

        let targetList = listAlias;
        if (!targetList) {
          targetList = await select({
            message: t('move.prompt', { name: card.name }),
            choices: [
              { name: `📝 ${t('move.lists.todo')}`, value: 'todo' },
              { name: `🔄 ${t('move.lists.doing')}`, value: 'doing' },
              { name: `✅ ${t('move.lists.done')}`, value: 'done' },
            ],
          });
        }

        const list = cache.getListByAlias(targetList);
        if (!list) {
          throw new TrelloError(
            t('move.errors.listNotFound', { list: targetList }),
            'LIST_NOT_FOUND'
          );
        }

        const moveSpinner = ora(t('move.moving', { list: list.name })).start();
        await client.cards.move(card.id, list.id);

        moveSpinner.succeed(`✓ ${t('move.success', { name: card.name, list: list.name })}`);
        logger.print(chalk.gray(`${t('common.url')} ${card.shortUrl}`));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return move;
}
