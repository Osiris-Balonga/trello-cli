import boxen from 'boxen';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { logger } from './logger.js';

// ============================================================================
// Progress Bar
// ============================================================================

export interface ProgressBarOptions {
  total: number;
  format?: string;
}

export function createProgressBar(options: ProgressBarOptions): cliProgress.SingleBar {
  const format = options.format || '{bar} {percentage}% | {value}/{total} | {task}';

  const bar = new cliProgress.SingleBar({
    format: chalk.cyan(format),
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true,
  }, cliProgress.Presets.shades_classic);

  bar.start(options.total, 0, { task: '' });
  return bar;
}

// ============================================================================
// Watch Display Box
// ============================================================================

export interface WatchDisplayOptions {
  title: string;
  status: string;
  due?: string;
  members?: string[];
  labels?: string[];
  commentCount: number;
  lastUpdated: string;
  interval: number;
  unchangedCount?: number;
}

export function displayWatchBox(options: WatchDisplayOptions): void {
  const lines: string[] = [];

  // Status line
  lines.push(`${chalk.bold('Status:')} ${options.status}`);

  // Due date
  if (options.due) {
    const date = new Date(options.due);
    const now = new Date();
    const isOverdue = date < now && date.toDateString() !== now.toDateString();
    const isToday = date.toDateString() === now.toDateString();
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (isOverdue) {
      lines.push(`${chalk.bold('Due:')} ${chalk.red(`${dateStr} ⚠ OVERDUE`)}`);
    } else if (isToday) {
      lines.push(`${chalk.bold('Due:')} ${chalk.yellow(`${dateStr} 📅 TODAY`)}`);
    } else {
      lines.push(`${chalk.bold('Due:')} ${chalk.white(dateStr)}`);
    }
  }

  // Members
  if (options.members && options.members.length > 0) {
    lines.push(`${chalk.bold('Members:')} ${chalk.cyan(options.members.join(', '))}`);
  }

  // Labels
  if (options.labels && options.labels.length > 0) {
    lines.push(`${chalk.bold('Labels:')} ${chalk.magenta(options.labels.join(', '))}`);
  }

  // Comments
  lines.push(`${chalk.bold('Comments:')} ${options.commentCount}`);

  // Separator
  lines.push('');

  // Last updated
  lines.push(chalk.gray(`Last updated: ${options.lastUpdated}`));

  // Refresh info
  if (options.unchangedCount && options.unchangedCount > 5) {
    lines.push(chalk.gray(`No changes detected (${options.unchangedCount}x) - backoff active`));
  }
  lines.push(chalk.gray(`Refreshing in ${options.interval}s... (Ctrl+C to stop)`));

  const content = lines.join('\n');

  const box = boxen(content, {
    title: `📋 ${options.title}`,
    titleAlignment: 'left',
    padding: 1,
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: 'cyan',
  });

  logger.print(box);
}
