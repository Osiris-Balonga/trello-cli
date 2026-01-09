import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

interface DeleteOptions {
  force?: boolean;
}

export function createDeleteCommand(): Command {
  const del = new Command('delete');

  del
    .description(t('cli.commands.delete'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-f, --force', t('cli.options.force'))
    .action(async (cardNumberStr: string, options: DeleteOptions) => {
      await handleDelete(parseInt(cardNumberStr, 10), options.force ?? false);
    });

  return del;
}

async function handleDelete(cardNumber: number, force: boolean): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const client = await createTrelloClient();
    const cards = await client.cards.listByBoard(boardId);

    if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
      throw new TrelloValidationError(
        t('delete.invalidCard', { max: cards.length }),
        'cardNumber'
      );
    }

    const card = cards[cardNumber - 1];
    const lists = cache.getLists();
    const listName =
      Object.values(lists).find((l) => l.id === card.idList)?.name ??
      t('common.unknown');

    console.log(chalk.yellow(`\n⚠️  ${t('delete.warning')}\n`));
    console.log(`${t('delete.cardLabel')} "${card.name}"`);
    console.log(`${t('delete.listLabel')} ${listName}`);
    console.log();

    if (!force) {
      const confirmed = await confirm({
        message: t('delete.confirm'),
        default: false,
      });

      if (!confirmed) {
        console.log(t('delete.cancelled'));
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
