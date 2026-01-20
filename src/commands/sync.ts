import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { createTrelloClient } from '../utils/create-client.js';
import { Cache } from '../core/cache.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import { handleCommandError } from '../utils/error-handler.js';

export function createSyncCommand(): Command {
  const sync = new Command('sync');

  sync
    .description(t('cli.commands.sync'))
    .action(async () => {
      await handleSync();
    });

  return sync;
}

async function handleSync(): Promise<void> {
  const cache = new Cache();
  await cache.load();

  const boardId = cache.getBoardId();
  if (!boardId) {
    logger.print(chalk.red(t('errors.cacheNotFound')));
    return;
  }

  const spinner = ora(t('sync.syncing')).start();

  try {
    const client = await createTrelloClient();

    const [members, labels, lists] = await Promise.all([
      client.members.listByBoard(boardId),
      client.labels.listByBoard(boardId),
      client.lists.listByBoard(boardId),
    ]);

    cache.setMembers(members);
    cache.setLabels(labels);
    cache.setAllLists(lists);
    cache.updateSyncTime();
    await cache.save();

    spinner.succeed(
      t('sync.success', {
        members: members.length,
        labels: labels.length,
        lists: lists.length,
      })
    );

    logger.print(
      chalk.gray(t('sync.lastSync', { date: new Date().toISOString() }))
    );
  } catch (error) {
    spinner.fail(t('sync.failed'));
    handleCommandError(error);
  }
}
