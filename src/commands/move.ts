import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface MoveOptions {
  all?: boolean;
}

export function createMoveCommand(): Command {
  const move = new Command('move');

  move
    .description(t('cli.commands.move'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .argument('[list]', t('cli.arguments.listName'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, listName: string | undefined, options: MoveOptions) => {
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
        const allCards = await client.cards.listByBoard(boardId);
        const lists = cache.getAllLists();
        const currentMemberId = cache.getCurrentMemberId();
        const memberId = options.all ? undefined : currentMemberId;
        const numberedCards = getNumberedCards(allCards, lists, { memberId });
        spinner.stop();

        const cardNumber = parseInt(cardNumberStr, 10);

        if (numberedCards.length === 0) {
          const message = memberId
            ? t('display.noCardsAvailableAssigned')
            : t('display.noCardsAvailable');
          throw new TrelloValidationError(message, 'cardNumber');
        }

        const card = numberedCards.find((c) => c.displayNumber === cardNumber);

        if (!card) {
          throw new TrelloValidationError(
            t('move.errors.invalidCard', { max: numberedCards.length }),
            'cardNumber'
          );
        }

        let targetList = listName ? cache.getListByName(listName) : undefined;

        if (!listName) {
          const selectedListId = await select({
            message: t('move.prompt', { name: card.name }),
            choices: lists.map((l) => ({
              name: l.name,
              value: l.id,
            })),
          });
          targetList = lists.find((l) => l.id === selectedListId);
        }

        if (!targetList) {
          throw new TrelloError(
            t('move.errors.listNotFound', { list: listName || '' }),
            'LIST_NOT_FOUND'
          );
        }

        const moveSpinner = ora(t('move.moving', { list: targetList.name })).start();
        await client.cards.move(card.id, targetList.id);

        moveSpinner.succeed(`${t('move.success', { name: card.name, list: targetList.name })}`);
        logger.print(chalk.gray(`${t('common.url')} ${card.shortUrl}`));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return move;
}
