import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { createProvider } from '../utils/create-provider.js';
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
    const providerType = cache.getProvider();
    const provider = await createProvider(providerType);

    const [members, labels, columns] = await Promise.all([
      provider.listMembers(boardId),
      provider.listLabels(boardId),
      provider.getBoardColumns(boardId),
    ]);

    cache.setMembers(members);
    cache.setLabels(labels);
    cache.setColumns(columns);
    cache.updateSyncTime();
    await cache.save();

    spinner.succeed(
      t('sync.success', {
        members: members.length,
        labels: labels.length,
        lists: columns.length,
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
