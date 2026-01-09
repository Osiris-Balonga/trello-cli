import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { Resolver } from '../core/resolver.js';
import { t } from '../utils/i18n.js';
import type { UpdateCardParams, Card } from '../api/types.js';

export function createUpdateCommand(): Command {
  const update = new Command('update');

  update
    .description(t('cli.commands.update'))
    .argument('<cardNumber>', 'Card number from list')
    .option('-n, --name <title>', 'New card title')
    .option('-d, --desc <text>', t('cli.options.description'))
    .option('--due <date>', t('cli.options.due'))
    .option('-l, --labels <names>', t('cli.options.labels'))
    .option('-m, --members <usernames>', t('cli.options.members'))
    .option('--archive', 'Archive the card')
    .option('--unarchive', t('cli.options.unarchive'))
    .action(
      async (
        cardNumberStr: string,
        options: {
          name?: string;
          desc?: string;
          due?: string;
          labels?: string;
          members?: string;
          archive?: boolean;
          unarchive?: boolean;
        }
      ) => {
        try {
          const cache = await loadCache();
          const client = await createTrelloClient();
          const resolver = new Resolver(cache);
          const boardId = cache.getBoardId();

          if (!boardId) {
            throw new TrelloError(
              'No board configured. Run "tt init" first.',
              'NOT_INITIALIZED'
            );
          }

          const spinner = ora('Loading cards...').start();
          const cards = await client.cards.listByBoard(boardId);
          spinner.stop();

          const cardNumber = parseInt(cardNumberStr, 10);
          if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
            throw new TrelloValidationError(
              `Invalid card number. Must be between 1 and ${cards.length}.`,
              'cardNumber'
            );
          }

          const card: Card = cards[cardNumber - 1];

          const hasOptions =
            options.name ||
            options.desc ||
            options.due ||
            options.labels ||
            options.members ||
            options.archive ||
            options.unarchive;

          if (!hasOptions) {
            console.log(chalk.cyan(`\nUpdating: ${card.name}\n`));

            const newName = await input({
              message: 'New title (leave empty to keep):',
              default: '',
            });

            const newDesc = await input({
              message: 'New description (leave empty to keep):',
              default: '',
            });

            if (newName.trim()) options.name = newName.trim();
            if (newDesc.trim()) options.desc = newDesc.trim();

            if (!options.name && !options.desc) {
              console.log(chalk.yellow('\nNo changes made.'));
              return;
            }
          }

          const params: UpdateCardParams = {};

          if (options.name) {
            if (options.name.length > 500) {
              throw new TrelloValidationError(
                'Title too long (max 500 characters)',
                'name'
              );
            }
            params.name = options.name;
          }

          if (options.desc !== undefined) {
            if (options.desc.length > 16384) {
              throw new TrelloValidationError(
                'Description too long (max 16384 characters)',
                'desc'
              );
            }
            params.desc = options.desc;
          }

          if (options.due) {
            if (options.due.toLowerCase() === 'clear') {
              params.due = '';
            } else {
              const dueDate = new Date(options.due);
              if (isNaN(dueDate.getTime())) {
                throw new TrelloValidationError(
                  'Invalid date format. Use YYYY-MM-DD.',
                  'due'
                );
              }
              params.due = dueDate.toISOString();
            }
          }

          if (options.labels) {
            const labelNames = options.labels
              .split(',')
              .map((l) => l.trim().toLowerCase());
            params.idLabels = resolver.resolveLabels(labelNames);
          }

          if (options.members) {
            const usernames = options.members
              .split(',')
              .map((m) => m.trim().toLowerCase().replace(/^@/, ''));
            params.idMembers = resolver.resolveMembers(usernames);
          }

          if (options.archive) {
            params.closed = true;
          } else if (options.unarchive) {
            params.closed = false;
          }

          if (Object.keys(params).length === 0) {
            console.log(chalk.yellow('\nNo changes to apply.'));
            return;
          }

          const updateSpinner = ora('Updating card...').start();
          const updatedCard = await client.cards.update(card.id, params);
          updateSpinner.succeed(`Card updated: ${updatedCard.name}`);

          console.log(chalk.gray(`URL: ${updatedCard.shortUrl}`));

          const changes: string[] = [];
          if (params.name) changes.push('title');
          if (params.desc !== undefined) changes.push('description');
          if (params.due !== undefined)
            changes.push(params.due ? 'due date' : 'due date cleared');
          if (params.idLabels) changes.push('labels');
          if (params.idMembers) changes.push('members');
          if (params.closed !== undefined)
            changes.push(params.closed ? 'archived' : 'unarchived');

          console.log(chalk.gray(`Changed: ${changes.join(', ')}`));
        } catch (error) {
          handleCommandError(error);
        }
      }
    );

  return update;
}
