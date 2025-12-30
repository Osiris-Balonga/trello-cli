import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { calculateStats, type BoardStats } from '../utils/statistics.js';
import type { Cache } from '../core/cache.js';

interface StatsOptions {
  member?: string;
  period?: string;
}

export function createStatsCommand(): Command {
  const stats = new Command('stats');

  stats
    .description('Display board statistics')
    .option('--member <username>', 'Stats for a specific member')
    .option('--period <days>', 'Time period in days', '30')
    .action(async (options: StatsOptions) => {
      await handleStats(options);
    });

  return stats;
}

async function handleStats(options: StatsOptions): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const spinner = ora(t('stats.loading')).start();
    const client = await createTrelloClient();
    const periodDays = parseInt(options.period || '30', 10);

    const cards = await client.cards.listByBoard(boardId);
    const actions = await client.boards.getActions(boardId, {
      filter: 'createCard,updateCard:closed,updateCard:idList',
      limit: 1000,
    });

    spinner.stop();

    let filteredCards = cards;
    let memberId: string | undefined;
    if (options.member) {
      const username = options.member.replace('@', '');
      const member = cache.getMemberByUsername(username);
      if (!member) {
        console.log(chalk.red(t('stats.memberNotFound', { username })));
        return;
      }
      memberId = member.id;
      const memberIdForFilter = memberId;
      filteredCards = cards.filter((c) => c.idMembers.includes(memberIdForFilter));
    }

    const stats = calculateStats(
      filteredCards,
      actions,
      cache,
      periodDays,
      memberId
    );

    displayStats(stats, cache, options, periodDays);
  } catch (error) {
    handleCommandError(error);
  }
}

function displayStats(
  stats: BoardStats,
  cache: Cache,
  options: StatsOptions,
  period: number
): void {
  console.log(
    chalk.bold(`\n${t('stats.title', { name: cache.getBoardName() })}\n`)
  );
  console.log(chalk.gray(t('stats.period', { days: period })));
  if (options.member) {
    console.log(
      chalk.gray(t('stats.member', { member: options.member.replace('@', '') }))
    );
  }

  console.log(chalk.bold(`\n${t('stats.cardsSection')}:`));
  console.log('─'.repeat(55));
  console.log(`${t('stats.total')}:       ${stats.cards.total}`);
  console.log(`${t('stats.created')}:     ${stats.cards.created}`);
  console.log(`${t('stats.completed')}:   ${stats.cards.completed}`);
  console.log(`${t('stats.archived')}:    ${stats.cards.archived}`);
  console.log(`${t('stats.inProgress')}: ${stats.cards.inProgress}`);

  console.log(chalk.bold(`\n${t('stats.velocitySection')}:`));
  console.log('─'.repeat(55));
  console.log(
    `${t('stats.avgCompletion')}: ${stats.velocity.cardsPerWeek.toFixed(1)} ${t('stats.cardsPerWeek')}`
  );
  console.log(
    `${t('stats.avgCycleTime')}: ${stats.velocity.avgCycleTime.toFixed(1)} ${t('stats.days')}`
  );

  if (!options.member && Object.keys(stats.members).length > 0) {
    console.log(chalk.bold(`\n${t('stats.membersSection')}:`));
    console.log('─'.repeat(55));
    const maxCards = Math.max(...Object.values(stats.members));
    for (const [username, count] of Object.entries(stats.members).sort(
      (a, b) => b[1] - a[1]
    )) {
      const bar = '█'.repeat(Math.round((count / maxCards) * 20));
      const percent = ((count / stats.cards.total) * 100).toFixed(0);
      console.log(
        `@${username.padEnd(12)} ${String(count).padStart(3)} ${t('stats.cards')} (${percent}%)  ${chalk.green(bar)}`
      );
    }
  }

  if (Object.keys(stats.labels).length > 0) {
    console.log(chalk.bold(`\n${t('stats.labelsSection')}:`));
    console.log('─'.repeat(55));
    const maxLabels = Math.max(...Object.values(stats.labels));
    for (const [label, count] of Object.entries(stats.labels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)) {
      const bar = '█'.repeat(Math.round((count / maxLabels) * 15));
      console.log(
        `${label.padEnd(15)} ${String(count).padStart(3)} ${t('stats.cards')}  ${chalk.blue(bar)}`
      );
    }
  }

  if (stats.trends) {
    console.log(chalk.bold(`\n${t('stats.trendsSection')}:`));
    console.log('─'.repeat(55));
    const prodSign = stats.trends.productivityChange >= 0 ? '+' : '';
    console.log(
      `${stats.trends.productivityChange >= 0 ? '📈' : '📉'} ${prodSign}${stats.trends.productivityChange}% ${t('stats.productivityVsLastPeriod')}`
    );
    console.log(`✅ ${stats.trends.completionRate}% ${t('stats.completionRate')}`);
  }
}
