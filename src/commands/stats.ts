import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { withBoardContext } from '../utils/command-context.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import { calculateStats, type BoardStats } from '../utils/statistics.js';
import type { Cache } from '../core/cache.js';

interface StatsOptions {
  member?: string;
  period?: string;
}

export function createStatsCommand(): Command {
  const stats = new Command('stats');

  stats
    .description(t('cli.commands.stats'))
    .option('--member <username>', t('cli.options.member'))
    .option('--period <days>', t('cli.options.period'), '30')
    .action(async (options: StatsOptions) => {
      await handleStats(options);
    });

  return stats;
}

async function handleStats(options: StatsOptions): Promise<void> {
  try {
    const spinner = ora(t('stats.loading')).start();

    await withBoardContext(async ({ cache, client, boardId }) => {
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
          logger.print(chalk.red(t('stats.memberNotFound', { username })));
          return;
        }
        memberId = member.id;
        const memberIdForFilter = memberId;
        filteredCards = cards.filter((c) =>
          c.idMembers.includes(memberIdForFilter)
        );
      }

      const stats = calculateStats(
        filteredCards,
        actions,
        cache,
        periodDays,
        memberId
      );

      displayStats(stats, cache, options, periodDays);
    });
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
  logger.print(
    chalk.bold(`\n${t('stats.title', { name: cache.getBoardName() })}\n`)
  );
  logger.print(chalk.gray(t('stats.period', { days: period })));
  if (options.member) {
    logger.print(
      chalk.gray(
        t('stats.member', { member: options.member.replace('@', '') })
      )
    );
  }

  logger.print(chalk.bold(`\n${t('stats.cardsSection')}:`));
  logger.print('─'.repeat(55));
  logger.print(`${t('stats.total')}:       ${stats.cards.total}`);
  logger.print(`${t('stats.created')}:     ${stats.cards.created}`);
  logger.print(`${t('stats.completed')}:   ${stats.cards.completed}`);
  logger.print(`${t('stats.archived')}:    ${stats.cards.archived}`);

  logger.print(chalk.bold(`\n${t('stats.velocitySection')}:`));
  logger.print('─'.repeat(55));
  logger.print(
    `${t('stats.avgCompletion')}: ${stats.velocity.cardsPerWeek.toFixed(1)} ${t('stats.cardsPerWeek')}`
  );
  logger.print(
    `${t('stats.avgCycleTime')}: ${stats.velocity.avgCycleTime.toFixed(1)} ${t('stats.days')}`
  );

  if (!options.member && Object.keys(stats.members).length > 0) {
    logger.print(chalk.bold(`\n${t('stats.membersSection')}:`));
    logger.print('─'.repeat(55));
    const maxCards = Math.max(...Object.values(stats.members));
    for (const [username, count] of Object.entries(stats.members).sort(
      (a, b) => b[1] - a[1]
    )) {
      const bar = '█'.repeat(Math.round((count / maxCards) * 20));
      const percent = ((count / stats.cards.total) * 100).toFixed(0);
      logger.print(
        `@${username.padEnd(12)} ${String(count).padStart(3)} ${t('stats.cards')} (${percent}%)  ${chalk.green(bar)}`
      );
    }
  }

  if (Object.keys(stats.labels).length > 0) {
    logger.print(chalk.bold(`\n${t('stats.labelsSection')}:`));
    logger.print('─'.repeat(55));
    const maxLabels = Math.max(...Object.values(stats.labels));
    for (const [label, count] of Object.entries(stats.labels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)) {
      const bar = '█'.repeat(Math.round((count / maxLabels) * 15));
      logger.print(
        `${label.padEnd(15)} ${String(count).padStart(3)} ${t('stats.cards')}  ${chalk.blue(bar)}`
      );
    }
  }

  if (stats.trends) {
    logger.print(chalk.bold(`\n${t('stats.trendsSection')}:`));
    logger.print('─'.repeat(55));
    const prodSign = stats.trends.productivityChange >= 0 ? '+' : '';
    logger.print(
      `${stats.trends.productivityChange >= 0 ? '📈' : '📉'} ${prodSign}${stats.trends.productivityChange}% ${t('stats.productivityVsLastPeriod')}`
    );
    logger.print(
      `✅ ${stats.trends.completionRate}% ${t('stats.completionRate')}`
    );
  }
}
