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
import { logger } from '../utils/logger.js';
import type { UpdateCardParams, Card } from '../api/types.js';

export function createUpdateCommand(): Command {
  const update = new Command('update');

  update
    .description(t('cli.commands.update'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-n, --name <title>', t('cli.arguments.name'))
    .option('-d, --desc <text>', t('cli.options.description'))
    .option('--due <date>', t('cli.options.due'))
    .option('-l, --labels <names>', t('cli.options.labels'))
    .option('-m, --members <usernames>', t('cli.options.members'))
    .option('--archive', t('cli.options.archive'))
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
              t('update.errors.notInitialized'),
              'NOT_INITIALIZED'
            );
          }

          const spinner = ora(t('list.loading')).start();
          const cards = await client.cards.listByBoard(boardId);
          spinner.stop();

          const cardNumber = parseInt(cardNumberStr, 10);
          if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
            throw new TrelloValidationError(
              t('update.errors.invalidCard', { max: cards.length }),
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
            logger.print(chalk.cyan(`\n${t('update.title', { name: card.name })}\n`));

            const newName = await input({
              message: t('update.prompts.newTitle'),
              default: '',
            });

            const newDesc = await input({
              message: t('update.prompts.newDesc'),
              default: '',
            });

            if (newName.trim()) options.name = newName.trim();
            if (newDesc.trim()) options.desc = newDesc.trim();

            if (!options.name && !options.desc) {
              logger.print(chalk.yellow(`\n${t('update.noChanges')}`));
              return;
            }
          }

          const params: UpdateCardParams = {};

          if (options.name) {
            if (options.name.length > 500) {
              throw new TrelloValidationError(
                t('update.validation.titleTooLong'),
                'name'
              );
            }
            params.name = options.name;
          }

          if (options.desc !== undefined) {
            if (options.desc.length > 16384) {
              throw new TrelloValidationError(
                t('update.validation.descTooLong'),
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
                  t('update.validation.invalidDate'),
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
            logger.print(chalk.yellow(`\n${t('update.noChangesToApply')}`));
            return;
          }

          const updateSpinner = ora(t('update.updating')).start();
          const updatedCard = await client.cards.update(card.id, params);
          updateSpinner.succeed(t('update.success', { name: updatedCard.name }));

          logger.print(chalk.gray(`${t('common.url')} ${updatedCard.shortUrl}`));

          const changes: string[] = [];
          if (params.name) changes.push(t('update.changes.title'));
          if (params.desc !== undefined) changes.push(t('update.changes.description'));
          if (params.due !== undefined)
            changes.push(params.due ? t('update.changes.dueDate') : t('update.changes.dueDateCleared'));
          if (params.idLabels) changes.push(t('update.changes.labels'));
          if (params.idMembers) changes.push(t('update.changes.members'));
          if (params.closed !== undefined)
            changes.push(params.closed ? t('update.changes.archived') : t('update.changes.unarchived'));

          logger.print(chalk.gray(t('update.changed', { changes: changes.join(', ') })));
        } catch (error) {
          handleCommandError(error);
        }
      }
    );

  return update;
}
