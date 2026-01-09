import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

const LABEL_COLORS: Record<string, string> = {
  green: '#61bd4f',
  yellow: '#f2d600',
  orange: '#ff9f1a',
  red: '#eb5a46',
  purple: '#c377e0',
  blue: '#0079bf',
  sky: '#00c2e0',
  lime: '#51e898',
  pink: '#ff78cb',
  black: '#344563',
};

function formatLabelColor(color: string | null): string {
  if (!color) return chalk.gray('No color');

  const colorMap: Record<string, (text: string) => string> = {
    green: (t) => chalk.green(t),
    yellow: (t) => chalk.yellow(t),
    orange: (t) => chalk.hex('#ff9f1a')(t),
    red: (t) => chalk.red(t),
    purple: (t) => chalk.magenta(t),
    blue: (t) => chalk.blue(t),
    sky: (t) => chalk.cyan(t),
    lime: (t) => chalk.greenBright(t),
    pink: (t) => chalk.hex('#ff78cb')(t),
    black: (t) => chalk.gray(t),
  };

  const formatter = colorMap[color.toLowerCase()] || ((t: string) => chalk.white(t));
  return formatter(`● ${color}`);
}

export function createLabelsCommand(): Command {
  const labels = new Command('labels');

  labels.description(t('cli.commands.labels'));

  labels
    .command('list')
    .description(t('cli.subcommands.labels.list'))
    .option('--refresh', 'Refresh label list from Trello')
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

        let labelsData = cache.getLabels();

        if (options.refresh || Object.keys(labelsData).length === 0) {
          const spinner = ora('Fetching labels from Trello...').start();
          const client = await createTrelloClient();
          const labelsList = await client.labels.listByBoard(boardId);
          cache.setLabels(labelsList);
          cache.updateSyncTime();
          await cache.save();
          spinner.succeed('Labels refreshed');
          labelsData = cache.getLabels();
        }

        const labelEntries = Object.entries(labelsData);

        if (labelEntries.length === 0) {
          console.log(chalk.yellow('\nNo labels found on this board.'));
          return;
        }

        console.log(chalk.cyan(`\n🏷️  Board Labels (${labelEntries.length})\n`));

        const table = new Table({
          head: [
            chalk.bold('#'),
            chalk.bold('Name'),
            chalk.bold('Color'),
          ],
          style: { head: [], border: [] },
        });

        labelEntries.forEach(([name, label], index) => {
          table.push([
            chalk.gray(String(index + 1)),
            chalk.white(name),
            formatLabelColor(label.color),
          ]);
        });

        console.log(table.toString());
        console.log();

        console.log(chalk.gray('Available colors:'));
        console.log(
          chalk.gray(
            Object.keys(LABEL_COLORS).join(', ')
          )
        );
        console.log();
      } catch (error) {
        handleCommandError(error);
      }
    });

  return labels;
}
