import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface DeleteOptions {
  force?: boolean;
  all?: boolean;
}

export function createDeleteCommand(): Command {
  const del = new Command('delete');

  del
    .description(t('cli.commands.delete'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-f, --force', t('cli.options.force'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, options: DeleteOptions) => {
      await handleDelete(parseInt(cardNumberStr, 10), options.force ?? false, options.all ?? false);
    });

  return del;
}

async function handleDelete(cardNumber: number, force: boolean, all: boolean): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    const card = numberedCards.find((c) => c.displayNumber === cardNumber);

    if (!card) {
      throw new TrelloValidationError(
        t('delete.invalidCard', { max: numberedCards.length }),
        'cardNumber'
      );
    }
    const list = cache.getListById(card.idList);
    const listName = list?.name ?? t('common.unknown');

    logger.print(chalk.yellow(`\n⚠️  ${t('delete.warning')}\n`));
    logger.print(`${t('delete.cardLabel')} "${card.name}"`);
    logger.print(`${t('delete.listLabel')} ${listName}`);
    logger.newline();

    if (!force) {
      const confirmed = await confirm({
        message: t('delete.confirm'),
        default: false,
      });

      if (!confirmed) {
        logger.print(t('delete.cancelled'));
        return;
      }
    }

    const spinner = ora(t('delete.deleting')).start();

    await client.cards.delete(card.id);
    spinner.succeed(t('delete.success', { name: card.name }));
  } catch (error) {
    handleCommandError(error);
  }
}
