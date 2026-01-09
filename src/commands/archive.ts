import { Command } from 'commander';
import ora from 'ora';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

interface ArchiveOptions {
  undo?: boolean;
}

export function createArchiveCommand(): Command {
  const archive = new Command('archive');

  archive
    .description(t('cli.commands.archive'))
    .argument('<cardNumber>', 'Card number from tt list')
    .option('--undo', t('cli.options.unarchive'))
    .action(async (cardNumberStr: string, options: ArchiveOptions) => {
      await handleArchive(parseInt(cardNumberStr, 10), options.undo ?? false);
    });

  return archive;
}

async function handleArchive(cardNumber: number, undo: boolean): Promise<void> {
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
        t('archive.invalidCard', { max: cards.length }),
        'cardNumber'
      );
    }

    const card = cards[cardNumber - 1];
    const actionKey = undo ? 'unarchiving' : 'archiving';
    const spinner = ora(t(`archive.${actionKey}`)).start();

    if (undo) {
      await client.cards.unarchive(card.id);
      spinner.succeed(t('archive.unarchiveSuccess', { name: card.name }));
    } else {
      await client.cards.archive(card.id);
      spinner.succeed(t('archive.archiveSuccess', { name: card.name }));
    }
  } catch (error) {
    handleCommandError(error);
  }
}
