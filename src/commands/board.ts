import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { isBefore } from 'date-fns';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';

export function createBoardCommand(): Command {
  const board = new Command('board');

  board
    .description(t('cli.commands.board'))
    .addCommand(createBoardInfoCommand());

  return board;
}

function createBoardInfoCommand(): Command {
  const info = new Command('info');

  info.description(t('cli.subcommands.board.info')).action(async () => {
    await handleBoardInfo();
  });

  return info;
}

async function handleBoardInfo(): Promise<void> {
  const spinner = ora(t('common.loading')).start();

  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      spinner.fail();
      console.log(chalk.red(t('errors.cacheNotFound')));
      return;
    }

    const client = await createTrelloClient();

    const board = await client.boards.get(boardId);
    const cards = await client.cards.listByBoard(boardId);

    spinner.stop();

    const openCards = cards.filter((c) => !c.closed);
    const now = new Date();
    const overdueCards = cards.filter(
      (c) => c.due && isBefore(new Date(c.due), now) && !c.dueComplete
    );

    const members = cache.getMembers();
    const labels = cache.getLabels();
    const lists = cache.getLists();

    const memberCount = Object.keys(members).length;
    const labelCount = Object.keys(labels).length;
    const listCount = Object.keys(lists).length;

    console.log(chalk.bold(`\n╔${'═'.repeat(58)}╗`));
    console.log(chalk.bold(`║  ${board.name.padEnd(55)} ║`));
    console.log(chalk.bold(`╚${'═'.repeat(58)}╝\n`));

    if (board.desc) {
      console.log(chalk.gray(t('board.info.description')));
      console.log(board.desc + '\n');
    }

    console.log(chalk.gray(t('board.info.statistics')));
    console.log(`📋 ${t('board.info.lists')}    ${listCount}`);
    console.log(`👥 ${t('board.info.members')}  ${memberCount}`);
    console.log(`🏷️  ${t('board.info.labels')}   ${labelCount}`);
    console.log(`📝 ${t('board.info.cards')}    ${openCards.length}`);
    if (overdueCards.length > 0) {
      console.log(chalk.red(`⚠️  ${t('board.info.overdue')}  ${overdueCards.length}`));
    }

    console.log(chalk.gray(`\n🔗 ${board.url}`));

    const lastSync = cache.getLastSync();
    const lastSyncDisplay = lastSync
      ? new Date(lastSync).toLocaleString()
      : t('common.notSet');
    console.log(chalk.gray(`\n${t('board.info.lastSync')} ${lastSyncDisplay}\n`));
  } catch (error) {
    spinner.fail();
    handleCommandError(error);
  }
}
