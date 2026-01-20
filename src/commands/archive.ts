import { Command } from 'commander';
import ora from 'ora';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

interface ArchiveOptions {
  undo?: boolean;
  all?: boolean;
}

export function createArchiveCommand(): Command {
  const archive = new Command('archive');

  archive
    .description(t('cli.commands.archive'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('--undo', t('cli.options.unarchive'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, options: ArchiveOptions) => {
      await handleArchive(parseInt(cardNumberStr, 10), options.undo ?? false, options.all ?? false);
    });

  return archive;
}

async function handleArchive(cardNumber: number, undo: boolean, all: boolean): Promise<void> {
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
        t('archive.invalidCard', { max: numberedCards.length }),
        'cardNumber'
      );
    }
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
