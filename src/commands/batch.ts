import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { Card } from '../api/types.js';

interface BatchOptions {
  dryRun?: boolean;
  parallel?: boolean;
  all?: boolean;
}

export function createBatchCommand(): Command {
  const batch = new Command('batch');

  batch.description(t('cli.commands.batch'));

  batch
    .command('move <list> <cards...>')
    .description(t('cli.subcommands.batch.move'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (list: string, cards: string[], options: BatchOptions) => {
      await handleBatchMove(list, cards, options);
    });

  batch
    .command('archive <cards...>')
    .description(t('cli.subcommands.batch.archive'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cards: string[], options: BatchOptions) => {
      await handleBatchArchive(cards, options, true);
    });

  batch
    .command('unarchive <cards...>')
    .description(t('cli.subcommands.batch.unarchive'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cards: string[], options: BatchOptions) => {
      await handleBatchArchive(cards, options, false);
    });

  batch
    .command('label <name> <cards...>')
    .description(t('cli.subcommands.batch.label'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (name: string, cards: string[], options: BatchOptions) => {
      await handleBatchLabel(name, cards, options, 'add');
    });

  batch
    .command('unlabel <name> <cards...>')
    .description(t('cli.subcommands.batch.unlabel'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (name: string, cards: string[], options: BatchOptions) => {
      await handleBatchLabel(name, cards, options, 'remove');
    });

  batch
    .command('assign <username> <cards...>')
    .description(t('cli.subcommands.batch.assign'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(
      async (username: string, cards: string[], options: BatchOptions) => {
        await handleBatchAssign(username, cards, options, 'add');
      }
    );

  batch
    .command('unassign <username> <cards...>')
    .description(t('cli.subcommands.batch.unassign'))
    .option('--dry-run', t('cli.options.dryRun'))
    .option('--parallel', t('cli.options.parallel'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(
      async (username: string, cards: string[], options: BatchOptions) => {
        await handleBatchAssign(username, cards, options, 'remove');
      }
    );

  return batch;
}

function getCardsByNumbers(
  numberedCards: Array<Card & { displayNumber: number }>,
  cardNumbers: string[]
): { targetCards: Card[]; invalidCards: number[] } {
  const cardNums = cardNumbers.map((n) => parseInt(n, 10));
  const cardMap = new Map(numberedCards.map((c) => [c.displayNumber, c]));

  const invalidCards = cardNums.filter((n) => !cardMap.has(n) || isNaN(n));
  const targetCards = cardNums
    .map((n) => cardMap.get(n))
    .filter((c): c is Card & { displayNumber: number } => c !== undefined);

  return { targetCards, invalidCards };
}

async function handleBatchMove(
  listName: string,
  cardNumbers: string[],
  options: BatchOptions
): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const list = cache.getListByName(listName);
    if (!list) {
      const availableLists = cache.getAllLists().map((l) => l.name).join(', ');
      logger.print(chalk.red(t('batch.listNotFound', { list: listName }) + ` (${t('common.available')}: ${availableLists})`));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = options.all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    const { targetCards, invalidCards } = getCardsByNumbers(numberedCards, cardNumbers);

    if (invalidCards.length > 0) {
      logger.print(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    if (options.dryRun) {
      logger.print(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        logger.print(`  • "${card.name}" → ${list.name}`);
      }
      return;
    }

    const spinner = ora(
      t('batch.moving', { count: targetCards.length })
    ).start();
    const limit = pLimit(options.parallel ? 5 : 1);
    let success = 0;
    let failed = 0;

    await Promise.all(
      targetCards.map((card) =>
        limit(async () => {
          try {
            await client.cards.update(card.id, { idList: list.id });
            success++;
          } catch {
            failed++;
          }
        })
      )
    );

    spinner.succeed(t('batch.moveComplete', { success, failed }));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleBatchArchive(
  cardNumbers: string[],
  options: BatchOptions,
  archive: boolean
): Promise<void> {
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
    const memberId = options.all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    const { targetCards, invalidCards } = getCardsByNumbers(numberedCards, cardNumbers);

    if (invalidCards.length > 0) {
      logger.print(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    const action = archive ? 'archive' : 'unarchive';

    if (options.dryRun) {
      logger.print(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        logger.print(`  • ${action}: "${card.name}"`);
      }
      return;
    }

    const spinnerKey = archive ? 'batch.archiving' : 'batch.unarchiving';
    const spinner = ora(t(spinnerKey, { count: targetCards.length })).start();
    const limit = pLimit(options.parallel ? 5 : 1);
    let success = 0;
    let failed = 0;

    await Promise.all(
      targetCards.map((card) =>
        limit(async () => {
          try {
            if (archive) {
              await client.cards.archive(card.id);
            } else {
              await client.cards.unarchive(card.id);
            }
            success++;
          } catch {
            failed++;
          }
        })
      )
    );

    const completeKey = archive
      ? 'batch.archiveComplete'
      : 'batch.unarchiveComplete';
    spinner.succeed(t(completeKey, { success, failed }));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleBatchLabel(
  labelName: string,
  cardNumbers: string[],
  options: BatchOptions,
  action: 'add' | 'remove'
): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const label = cache.getLabelByName(labelName);
    if (!label) {
      logger.print(chalk.red(t('batch.labelNotFound', { label: labelName })));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = options.all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    const { targetCards, invalidCards } = getCardsByNumbers(numberedCards, cardNumbers);

    if (invalidCards.length > 0) {
      logger.print(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    if (options.dryRun) {
      logger.print(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        const actionWord = action === 'add' ? 'to' : 'from';
        logger.print(
          `  • ${action} label "${labelName}" ${actionWord}: "${card.name}"`
        );
      }
      return;
    }

    const spinner = ora(
      t('batch.labeling', { count: targetCards.length })
    ).start();
    const limit = pLimit(options.parallel ? 5 : 1);
    let success = 0;
    let failed = 0;

    await Promise.all(
      targetCards.map((card) =>
        limit(async () => {
          try {
            if (action === 'add') {
              await client.cards.addLabel(card.id, label.id);
            } else {
              await client.cards.removeLabel(card.id, label.id);
            }
            success++;
          } catch {
            failed++;
          }
        })
      )
    );

    spinner.succeed(t('batch.labelComplete', { success, failed, action }));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleBatchAssign(
  username: string,
  cardNumbers: string[],
  options: BatchOptions,
  action: 'add' | 'remove'
): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const cleanUsername = username.replace('@', '');
    const member = cache.getMemberByUsername(cleanUsername);
    if (!member) {
      logger.print(chalk.red(t('batch.memberNotFound', { member: username })));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = options.all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    const { targetCards, invalidCards } = getCardsByNumbers(numberedCards, cardNumbers);

    if (invalidCards.length > 0) {
      logger.print(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    if (options.dryRun) {
      logger.print(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        const actionWord = action === 'add' ? 'to' : 'from';
        logger.print(
          `  • ${action} @${cleanUsername} ${actionWord}: "${card.name}"`
        );
      }
      return;
    }

    const spinner = ora(
      t('batch.assigning', { count: targetCards.length })
    ).start();
    const limit = pLimit(options.parallel ? 5 : 1);
    let success = 0;
    let failed = 0;

    await Promise.all(
      targetCards.map((card) =>
        limit(async () => {
          try {
            if (action === 'add') {
              await client.cards.addMember(card.id, member.id);
            } else {
              await client.cards.removeMember(card.id, member.id);
            }
            success++;
          } catch {
            failed++;
          }
        })
      )
    );

    spinner.succeed(t('batch.assignComplete', { success, failed, action }));
  } catch (error) {
    handleCommandError(error);
  }
}
