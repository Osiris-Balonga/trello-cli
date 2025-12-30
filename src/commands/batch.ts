import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

interface BatchOptions {
  dryRun?: boolean;
  parallel?: boolean;
}

export function createBatchCommand(): Command {
  const batch = new Command('batch');

  batch.description('Perform bulk operations on multiple cards');

  batch
    .command('move <list> <cards...>')
    .description('Move multiple cards to a list')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(async (list: string, cards: string[], options: BatchOptions) => {
      await handleBatchMove(list, cards, options);
    });

  batch
    .command('archive <cards...>')
    .description('Archive multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(async (cards: string[], options: BatchOptions) => {
      await handleBatchArchive(cards, options, true);
    });

  batch
    .command('unarchive <cards...>')
    .description('Unarchive multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(async (cards: string[], options: BatchOptions) => {
      await handleBatchArchive(cards, options, false);
    });

  batch
    .command('label <name> <cards...>')
    .description('Add a label to multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(async (name: string, cards: string[], options: BatchOptions) => {
      await handleBatchLabel(name, cards, options, 'add');
    });

  batch
    .command('unlabel <name> <cards...>')
    .description('Remove a label from multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(async (name: string, cards: string[], options: BatchOptions) => {
      await handleBatchLabel(name, cards, options, 'remove');
    });

  batch
    .command('assign <username> <cards...>')
    .description('Assign a member to multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(
      async (username: string, cards: string[], options: BatchOptions) => {
        await handleBatchAssign(username, cards, options, 'add');
      }
    );

  batch
    .command('unassign <username> <cards...>')
    .description('Unassign a member from multiple cards')
    .option('--dry-run', 'Preview without executing')
    .option('--parallel', 'Execute in parallel')
    .action(
      async (username: string, cards: string[], options: BatchOptions) => {
        await handleBatchAssign(username, cards, options, 'remove');
      }
    );

  return batch;
}

async function handleBatchMove(
  listAlias: string,
  cardNumbers: string[],
  options: BatchOptions
): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const list = cache.getListByAlias(listAlias);
    if (!list) {
      console.log(chalk.red(t('batch.listNotFound', { list: listAlias })));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const cardNums = cardNumbers.map((n) => parseInt(n, 10));

    const invalidCards = cardNums.filter(
      (n) => n < 1 || n > allCards.length || isNaN(n)
    );
    if (invalidCards.length > 0) {
      console.log(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    const targetCards = cardNums.map((n) => allCards[n - 1]);

    if (options.dryRun) {
      console.log(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        console.log(`  • "${card.name}" → ${list.name}`);
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
    const cardNums = cardNumbers.map((n) => parseInt(n, 10));

    const invalidCards = cardNums.filter(
      (n) => n < 1 || n > allCards.length || isNaN(n)
    );
    if (invalidCards.length > 0) {
      console.log(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    const targetCards = cardNums.map((n) => allCards[n - 1]);
    const action = archive ? 'archive' : 'unarchive';

    if (options.dryRun) {
      console.log(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        console.log(`  • ${action}: "${card.name}"`);
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
      console.log(chalk.red(t('batch.labelNotFound', { label: labelName })));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const cardNums = cardNumbers.map((n) => parseInt(n, 10));

    const invalidCards = cardNums.filter(
      (n) => n < 1 || n > allCards.length || isNaN(n)
    );
    if (invalidCards.length > 0) {
      console.log(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    const targetCards = cardNums.map((n) => allCards[n - 1]);

    if (options.dryRun) {
      console.log(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        const actionWord = action === 'add' ? 'to' : 'from';
        console.log(
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
      console.log(chalk.red(t('batch.memberNotFound', { member: username })));
      return;
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const cardNums = cardNumbers.map((n) => parseInt(n, 10));

    const invalidCards = cardNums.filter(
      (n) => n < 1 || n > allCards.length || isNaN(n)
    );
    if (invalidCards.length > 0) {
      console.log(
        chalk.red(t('batch.invalidCards', { cards: invalidCards.join(', ') }))
      );
      return;
    }

    const targetCards = cardNums.map((n) => allCards[n - 1]);

    if (options.dryRun) {
      console.log(chalk.cyan(`\n${t('batch.dryRun')}:`));
      for (const card of targetCards) {
        const actionWord = action === 'add' ? 'to' : 'from';
        console.log(
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
