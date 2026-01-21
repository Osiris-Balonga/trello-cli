import chalk from 'chalk';
import Table from 'cli-table3';
import { format, formatDistanceToNow, isPast, isToday, isThisWeek } from 'date-fns';
import type { Task, Column } from '../models/index.js';
import type { Cache } from '../core/cache.js';
import { t } from './i18n.js';
import { logger } from './logger.js';

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, 'yyyy-MM-dd HH:mm');
}

export function formatDueDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
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

export interface NumberedTask extends Task {
  displayNumber: number;
  // Backwards compatibility aliases
  name: string;
  desc: string;
  idList: string;
  idMembers: string[];
  idLabels: string[];
  due: string | null;
  closed: boolean;
  shortUrl: string;
  dateLastActivity: string;
}

export interface GetNumberedTasksOptions {
  memberId?: string;
  cache?: Cache;
  isFiltered?: boolean;
}

export function getNumberedTasks(
  tasks: Task[],
  columns: Column[],
  options: GetNumberedTasksOptions = {}
): NumberedTask[] {
  const columnIds = new Set(columns.map((c) => c.id));
  const { memberId } = options;

  let globalIndex = 0;
  return tasks
    .filter((task) => {
      if (!columnIds.has(task.columnId)) return false;
      if (memberId && !task.assigneeIds.includes(memberId)) return false;
      return true;
    })
    .map((task) => ({
      ...task,
      displayNumber: ++globalIndex,
      // Backwards compatibility aliases
      name: task.title,
      desc: task.description ?? '',
      idList: task.columnId,
      idMembers: task.assigneeIds,
      idLabels: task.labelIds,
      due: task.dueDate?.toISOString() ?? null,
      closed: task.archived,
      shortUrl: task.url,
      dateLastActivity: task.updatedAt.toISOString(),
    }));
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function formatDue(due: Date | null): string {
  if (!due) return chalk.gray('-');

  const date = due;
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
      const colorFn = LABEL_COLORS[label.color ?? ''] || ((t: string) => chalk.gray(`[${t}]`));
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

export function displayTasksByColumn(
  tasks: Task[],
  columns: Column[],
  options: GetNumberedTasksOptions = {}
): void {
  const numberedTasks = getNumberedTasks(tasks, columns, options);
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const { cache, memberId, isFiltered } = options;

  const totalDisplayed = numberedTasks.length;
  const isFilteredByMember = isFiltered !== undefined ? isFiltered : !!memberId;

  if (totalDisplayed === 0) {
    if (isFilteredByMember) {
      logger.print(chalk.yellow(`\n${t('display.noCardsAssigned')}\n`));
    } else {
      logger.print(chalk.yellow(`\n${t('display.noCardsOnBoard')}\n`));
    }
    return;
  }

  for (const column of sortedColumns) {
    const columnTasks = numberedTasks.filter((task) => task.columnId === column.id);
    if (columnTasks.length === 0) continue;

    logger.print(chalk.bold(`\n${column.name} (${columnTasks.length})`));

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

    for (const task of columnTasks) {
      const title = task.archived
        ? chalk.strikethrough.gray(truncate(task.title, 38))
        : truncate(task.title, 38);

      table.push([
        chalk.yellow(String(task.displayNumber)),
        title,
        formatLabels(task.labelIds, cache),
        truncate(formatMembers(task.assigneeIds, cache), 12),
        formatDue(task.dueDate),
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

// Backwards compatibility aliases
export type NumberedCard = NumberedTask;
export type GetNumberedCardsOptions = GetNumberedTasksOptions;
export const getNumberedCards = getNumberedTasks;
export const displayCardsByList = displayTasksByColumn;
