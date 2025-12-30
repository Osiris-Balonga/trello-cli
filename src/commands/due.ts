import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import {
  isBefore,
  isToday,
  isThisWeek,
  isThisMonth,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import type { Card } from '../api/types.js';

interface DueOptions {
  overdue?: boolean;
  today?: boolean;
  week?: boolean;
  month?: boolean;
}

interface CardWithDue extends Card {
  dueDate: Date;
}

export function createDueCommand(): Command {
  const due = new Command('due');

  due
    .description('List cards with due dates')
    .option('--overdue', 'Show only overdue cards')
    .option('--today', 'Show only cards due today')
    .option('--week', 'Show only cards due this week')
    .option('--month', 'Show only cards due this month')
    .action(async (options: DueOptions) => {
      await handleDue(options);
    });

  return due;
}

async function handleDue(options: DueOptions): Promise<void> {
  const spinner = ora(t('common.loading')).start();

  try {
    const cache = await loadCache();
    const client = await createTrelloClient();
    const boardId = cache.getBoardId();

    if (!boardId) {
      spinner.fail();
      console.log(chalk.red(t('errors.cacheNotFound')));
      return;
    }

    const cards = await client.cards.listByBoard(boardId);

    const now = new Date();
    const cardsWithDue: CardWithDue[] = cards
      .filter((card): card is Card & { due: string } => card.due !== null)
      .map((card) => ({
        ...card,
        dueDate: parseISO(card.due),
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    spinner.stop();

    if (cardsWithDue.length === 0) {
      console.log(chalk.yellow(t('due.noCards')));
      return;
    }

    // Categorize
    const overdue = cardsWithDue.filter(
      (c) => isBefore(c.dueDate, now) && !c.dueComplete
    );
    const today = cardsWithDue.filter(
      (c) => isToday(c.dueDate) && !isBefore(c.dueDate, now)
    );
    const thisWeek = cardsWithDue.filter(
      (c) =>
        isThisWeek(c.dueDate) && !isToday(c.dueDate) && !isBefore(c.dueDate, now)
    );
    const later = cardsWithDue.filter(
      (c) => !isThisWeek(c.dueDate) && !isBefore(c.dueDate, now)
    );

    console.log(chalk.bold(`\n${t('due.title')}\n`));

    // Display based on options
    if (options.overdue) {
      displayCategory(t('due.overdue'), overdue, now);
    } else if (options.today) {
      displayCategory(t('due.today'), today, now);
    } else if (options.week) {
      displayCategory(t('due.thisWeek'), [...today, ...thisWeek], now);
    } else if (options.month) {
      const thisMonth = cardsWithDue.filter((c) => isThisMonth(c.dueDate));
      displayCategory(t('due.thisMonth'), thisMonth, now);
    } else {
      // Show all categories
      if (overdue.length > 0)
        displayCategory(`⚠️  ${t('due.overdue')}`, overdue, now);
      if (today.length > 0)
        displayCategory(`📅 ${t('due.today')}`, today, now);
      if (thisWeek.length > 0)
        displayCategory(`📅 ${t('due.thisWeek')}`, thisWeek, now);
      if (later.length > 0)
        displayCategory(`📅 ${t('due.later')}`, later, now);
    }

    console.log(
      chalk.gray(`\n${t('due.total', { count: cardsWithDue.length })}\n`)
    );
  } catch (error) {
    spinner.fail();
    handleCommandError(error);
  }
}

function displayCategory(
  title: string,
  cards: CardWithDue[],
  now: Date
): void {
  if (cards.length === 0) {
    console.log(chalk.yellow(`${title}: ${t('due.noCards')}`));
    return;
  }

  console.log(chalk.bold(`${title} (${cards.length})`));

  cards.forEach((card, index) => {
    const num = chalk.gray(`${index + 1}.`);
    const days = differenceInDays(card.dueDate, now);
    let dueInfo: string;

    if (days < 0) {
      dueInfo = chalk.red(t('due.daysAgo', { days: Math.abs(days) }));
    } else if (days === 0) {
      dueInfo = chalk.yellow(t('due.today'));
    } else {
      dueInfo = chalk.green(t('due.daysLeft', { days }));
    }

    const dateStr = chalk.gray(card.dueDate.toLocaleDateString());
    console.log(`  ${num} ${card.name}`);
    console.log(`      📅 ${dateStr} (${dueInfo})`);
  });

  console.log();
}
