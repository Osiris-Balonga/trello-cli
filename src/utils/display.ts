import chalk from 'chalk';
import { format, formatDistanceToNow, isPast, isToday, isThisWeek } from 'date-fns';
import type { Card, List } from '../api/types.js';
import { logger } from './logger.js';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd HH:mm');
}

export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const formatted = format(date, 'yyyy-MM-dd');

  if (isPast(date) && !isToday(date)) {
    return `${formatted} (OVERDUE)`;
  }
  if (isToday(date)) {
    return `${formatted} (TODAY)`;
  }
  if (isThisWeek(date)) {
    return `${formatted} (${formatDistanceToNow(date, { addSuffix: true })})`;
  }
  return formatted;
}

export function displayCardsByList(
  cards: Card[],
  lists: Record<string, List>
): void {
  for (const listAlias of ['todo', 'doing', 'done']) {
    const list = lists[listAlias];
    if (!list) continue;

    const listCards = cards.filter((c) => c.idList === list.id);
    if (listCards.length === 0) continue;

    logger.print(chalk.bold(`\n${list.name} (${listCards.length})`));

    listCards.forEach((card, index) => {
      const num = chalk.gray(`${index + 1}.`);
      const checkbox = card.closed ? chalk.gray('[✓]') : '[ ]';
      const title = card.closed ? chalk.gray(card.name) : card.name;

      logger.print(`  ${num} ${checkbox} ${title}`);

      if (card.due) {
        const dueDate = new Date(card.due);
        const now = new Date();
        let dueStr = dueDate.toLocaleDateString();

        if (dueDate < now) {
          dueStr = chalk.red(`Due: ${dueStr} (OVERDUE)`);
        } else if (dueDate.toDateString() === now.toDateString()) {
          dueStr = chalk.yellow(`Due: TODAY`);
        } else {
          dueStr = chalk.white(`Due: ${dueStr}`);
        }

        logger.print(`      📅 ${dueStr}`);
      }
    });
  }

  logger.print(chalk.gray(`\nTotal: ${cards.length} cards\n`));
}
