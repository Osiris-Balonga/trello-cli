import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

export function createMembersCommand(): Command {
  const members = new Command('members');

  members.description(t('cli.commands.members'));

  members
    .command('list')
    .description(t('cli.subcommands.members.list'))
    .option('--refresh', t('cli.options.refresh'))
    .action(async (options: { refresh?: boolean }) => {
      try {
        const cache = await loadCache();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(
            t('members.errors.notInitialized'),
            'NOT_INITIALIZED'
          );
        }

        let membersData = cache.getMembers();

        if (options.refresh || Object.keys(membersData).length === 0) {
          const spinner = ora(t('members.fetching')).start();
          const client = await createTrelloClient();
          const membersList = await client.members.listByBoard(boardId);
          cache.setMembers(membersList);
          cache.updateSyncTime();
          await cache.save();
          spinner.succeed(t('members.refreshed'));
          membersData = cache.getMembers();
        }

        const memberEntries = Object.entries(membersData);

        if (memberEntries.length === 0) {
          logger.print(chalk.yellow(`\n${t('members.noMembers')}`));
          return;
        }

        logger.print(chalk.cyan(`\n📋 ${t('members.title', { count: memberEntries.length })}\n`));

        const table = new Table({
          head: [
            chalk.bold(t('members.table.number')),
            chalk.bold(t('members.table.username')),
            chalk.bold(t('members.table.fullName')),
          ],
          style: { head: [], border: [] },
        });

        memberEntries.forEach(([username, member], index) => {
          table.push([
            chalk.gray(String(index + 1)),
            chalk.white(`@${username}`),
            chalk.gray(member.fullName),
          ]);
        });

        logger.print(table.toString());
        logger.newline();
      } catch (error) {
        handleCommandError(error);
      }
    });

  return members;
}
