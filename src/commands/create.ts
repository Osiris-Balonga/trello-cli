import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { Resolver } from '../core/resolver.js';
import {
  CreateCardOptionsSchema,
  formatZodErrors,
} from '../utils/validation.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';
import type { CreateCardParams } from '../api/types.js';

export function createCreateCommand(): Command {
  const create = new Command('create');

  create
    .description('Create a new card')
    .argument('[title]', 'Card title')
    .option('-d, --desc <text>', 'Card description')
    .option('--due <date>', 'Due date (YYYY-MM-DD)')
    .option('-l, --labels <names>', 'Label names (comma-separated)')
    .option('-m, --members <usernames>', 'Member usernames (comma-separated)')
    .option('--list <alias>', 'List alias (todo/doing/done)', 'todo')
    .action(async (title: string | undefined, rawOptions: unknown) => {
      try {
        const validationResult = CreateCardOptionsSchema.safeParse(rawOptions);

        if (!validationResult.success) {
          throw new TrelloValidationError(
            `Invalid options:\n${formatZodErrors(validationResult.error)}`
          );
        }

        const options = validationResult.data;

        const cache = await loadCache();
        const client = await createTrelloClient();
        const resolver = new Resolver(cache);

        let cardTitle = title;
        if (!cardTitle) {
          cardTitle = await input({
            message: 'Card title:',
            validate: (v) =>
              v.trim().length > 0 ? true : 'Title required',
          });
        }

        if (cardTitle.length > 500) {
          throw new TrelloValidationError(
            'Title too long (max 500 characters)',
            'title'
          );
        }

        let desc = options.desc;
        if (!desc && !title) {
          desc = await input({ message: 'Description (optional):' });
        }

        const list = cache.getListByAlias(options.list);
        if (!list) {
          throw new TrelloError(
            `List "${options.list}" not found in cache. Run "tt init" to refresh.`,
            'LIST_NOT_FOUND'
          );
        }

        const params: Partial<CreateCardParams> &
          Pick<CreateCardParams, 'name' | 'idList'> = {
          name: cardTitle.trim(),
          idList: list.id,
        };

        if (desc && desc.trim()) {
          params.desc = desc.trim();
        }

        if (options.due) {
          params.due = new Date(options.due).toISOString();
        }

        if (options.labels && options.labels.length > 0) {
          params.idLabels = resolver.resolveLabels(options.labels);
        }

        if (options.members && options.members.length > 0) {
          params.idMembers = resolver.resolveMembers(options.members);
        }

        const spinner = ora('Creating card...').start();
        const card = await client.cards.create(params as CreateCardParams);
        spinner.succeed(`Card created: ${card.name}`);

        console.log(chalk.gray(`URL: ${card.shortUrl}`));
        if (params.idLabels?.length) {
          console.log(chalk.gray(`Labels: ${options.labels?.join(', ')}`));
        }
        if (params.idMembers?.length) {
          console.log(chalk.gray(`Members: @${options.members?.join(', @')}`));
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  return create;
}
