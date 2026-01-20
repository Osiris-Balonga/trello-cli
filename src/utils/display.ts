import chalk from 'chalk';
import Table from 'cli-table3';
import { format, formatDistanceToNow, isPast, isToday, isThisWeek } from 'date-fns';
import type { Card, List } from '../api/types.js';
import type { Cache } from '../core/cache.js';
import { t } from './i18n.js';
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

export interface NumberedCard extends Card {
  displayNumber: number;
}

export interface GetNumberedCardsOptions {
  memberId?: string;
  cache?: Cache;
  isFiltered?: boolean;
}

export function getNumberedCards(
  cards: Card[],
  lists: List[],
  options: GetNumberedCardsOptions = {}
): NumberedCard[] {
  const listIds = new Set(lists.map((l) => l.id));
  const { memberId } = options;

  let globalIndex = 0;
  return cards
    .filter((card) => {
      if (!listIds.has(card.idList)) return false;
      if (memberId && !card.idMembers.includes(memberId)) return false;
      return true;
    })
    .map((card) => ({
      ...card,
      displayNumber: ++globalIndex,
    }));
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function formatDue(due: string | null): string {
  if (!due) return chalk.gray('-');

  const date = new Date(due);
  const formatted = format(date, 'MM/dd');

  if (isPast(date) && !isToday(date)) {
    return chalk.red(`${formatted} ⚠`);
  }
  if (isToday(date)) {
    return chalk.yellow(`${formatted} !`);
  }
  if (isThisWeek(date)) {
    return chalk.cyan(formatted);
  }
  return chalk.white(formatted);
}

const LABEL_COLORS: Record<string, (text: string) => string> = {
  red: (t) => chalk.bgRed.white(` ${t} `),
  orange: (t) => chalk.bgYellow.black(` ${t} `),
  yellow: (t) => chalk.bgYellowBright.black(` ${t} `),
  green: (t) => chalk.bgGreen.white(` ${t} `),
  blue: (t) => chalk.bgBlue.white(` ${t} `),
  purple: (t) => chalk.bgMagenta.white(` ${t} `),
  pink: (t) => chalk.bgMagentaBright.white(` ${t} `),
  sky: (t) => chalk.bgCyan.black(` ${t} `),
  lime: (t) => chalk.bgGreenBright.black(` ${t} `),
  black: (t) => chalk.bgBlackBright.white(` ${t} `),
};

function formatLabels(labelIds: string[], cache?: Cache): string {
  if (!cache || labelIds.length === 0) return chalk.gray('-');

  const labels = cache.getLabels();
  const labelNames: string[] = [];

  for (const [name, label] of Object.entries(labels)) {
    if (labelIds.includes(label.id)) {
      const colorFn = LABEL_COLORS[label.color] || ((t: string) => chalk.gray(`[${t}]`));
      labelNames.push(colorFn(name));
    }
  }

  return labelNames.length > 0 ? labelNames.join(' ') : chalk.gray('-');
}

function formatMembers(memberIds: string[], cache?: Cache): string {
  if (!cache || memberIds.length === 0) return chalk.gray('-');

  const members = cache.getMembers();
  const usernames: string[] = [];

  for (const [username, member] of Object.entries(members)) {
    if (memberIds.includes(member.id)) {
      usernames.push(`@${username}`);
    }
  }

  return usernames.length > 0 ? chalk.cyan(usernames.join(' ')) : chalk.gray('-');
}

export function displayCardsByList(
  cards: Card[],
  lists: List[],
  options: GetNumberedCardsOptions = {}
): void {
  const numberedCards = getNumberedCards(cards, lists, options);
  const sortedLists = [...lists].sort((a, b) => a.pos - b.pos);
  const { cache, memberId, isFiltered } = options;

  const totalDisplayed = numberedCards.length;
  const isFilteredByMember = isFiltered !== undefined ? isFiltered : !!memberId;

  if (totalDisplayed === 0) {
    if (isFilteredByMember) {
      logger.print(chalk.yellow(`\n${t('display.noCardsAssigned')}\n`));
    } else {
      logger.print(chalk.yellow(`\n${t('display.noCardsOnBoard')}\n`));
    }
    return;
  }

  for (const list of sortedLists) {
    const listCards = numberedCards.filter((c) => c.idList === list.id);
    if (listCards.length === 0) continue;

    logger.print(chalk.bold(`\n${list.name} (${listCards.length})`));

    const table = new Table({
      chars: {
        top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
        bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
        left: '', 'left-mid': '', mid: '', 'mid-mid': '',
        right: '', 'right-mid': '', middle: ' ',
      },
      style: { 'padding-left': 1, 'padding-right': 1 },
      colWidths: [5, 40, 18, 14, 8],
    });

    table.push([
      chalk.gray('#'),
      chalk.gray(t('table.title')),
      chalk.gray(t('table.labels')),
      chalk.gray(t('table.members')),
      chalk.gray(t('table.due')),
    ]);

    for (const card of listCards) {
      const title = card.closed
        ? chalk.strikethrough.gray(truncate(card.name, 38))
        : truncate(card.name, 38);

      table.push([
        chalk.yellow(String(card.displayNumber)),
        title,
        formatLabels(card.idLabels, cache),
        truncate(formatMembers(card.idMembers, cache), 12),
        formatDue(card.due),
      ]);
    }

    logger.print(table.toString());
  }

  if (isFilteredByMember) {
    logger.print(chalk.gray(`\n${t('display.totalCardsAssigned', { count: totalDisplayed })}\n`));
  } else {
    logger.print(chalk.gray(`\n${t('display.totalCards', { count: totalDisplayed })}\n`));
  }
}
