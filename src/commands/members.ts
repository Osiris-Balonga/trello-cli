import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';

export function createMembersCommand(): Command {
  const members = new Command('members');

  members.description('Manage board members');

  members
    .command('list')
    .description('List all board members')
    .option('--refresh', 'Refresh member list from Trello')
    .action(async (options: { refresh?: boolean }) => {
      try {
        const cache = await loadCache();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(
            'No board configured. Run "tt init" first.',
            'NOT_INITIALIZED'
          );
        }

        let membersData = cache.getMembers();

        if (options.refresh || Object.keys(membersData).length === 0) {
          const spinner = ora('Fetching members from Trello...').start();
          const client = await createTrelloClient();
          const membersList = await client.members.listByBoard(boardId);
          cache.setMembers(membersList);
          cache.updateSyncTime();
          await cache.save();
          spinner.succeed('Members refreshed');
          membersData = cache.getMembers();
        }

        const memberEntries = Object.entries(membersData);

        if (memberEntries.length === 0) {
          console.log(chalk.yellow('\nNo members found on this board.'));
          return;
        }

        console.log(chalk.cyan(`\n📋 Board Members (${memberEntries.length})\n`));

        const table = new Table({
          head: [
            chalk.bold('#'),
            chalk.bold('Username'),
            chalk.bold('Full Name'),
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

        console.log(table.toString());
        console.log();
      } catch (error) {
        handleCommandError(error);
      }
    });

  return members;
}
