import { Command } from 'commander';
import { input, confirm, select } from '@inquirer/prompts';
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
import { suggestCardTitleFromBranch } from '../core/git.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { CreateCardParams } from '../api/types.js';

export function createCreateCommand(): Command {
  const create = new Command('create');

  create
    .description(t('cli.commands.create'))
    .argument('[title]', t('cli.arguments.title'))
    .option('-d, --desc <text>', t('cli.options.description'))
    .option('--due <date>', t('cli.options.due'))
    .option('-l, --labels <names>', t('cli.options.labels'))
    .option('-m, --members <usernames>', t('cli.options.members'))
    .option('--list <name>', t('cli.options.list'))
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
          const suggestion = await suggestCardTitleFromBranch();

          if (suggestion) {
            const useSuggestion = await confirm({
              message: t('create.git.useBranchTitle', { title: suggestion }),
              default: true,
            });

            if (useSuggestion) {
              cardTitle = suggestion;
              logger.print(chalk.gray(t('create.git.usingBranchTitle')));
            }
          }

          if (!cardTitle) {
            cardTitle = await input({
              message: t('create.prompts.title'),
              validate: (v) =>
                v.trim().length > 0 ? true : t('create.validation.titleRequired'),
            });
          }
        }

        if (cardTitle.length > 500) {
          throw new TrelloValidationError(
            t('create.validation.titleTooLong'),
            'title'
          );
        }

        let desc = options.desc;
        if (!desc && !title) {
          desc = await input({ message: t('create.prompts.description') });
        }

        let list = options.list ? cache.getListByName(options.list) : undefined;

        if (options.list && !list) {
          const availableLists = cache.getAllLists().map((l) => l.name).join(', ');
          throw new TrelloError(
            t('create.errors.listNotFound', { list: options.list }) + ` (${t('common.available')}: ${availableLists})`,
            'LIST_NOT_FOUND'
          );
        }

        if (!list) {
          const lists = cache.getAllLists();
          const selectedListId = await select({
            message: t('create.prompts.list'),
            choices: lists.map((l) => ({ name: l.name, value: l.id })),
          });
          const selectedList = lists.find((l) => l.id === selectedListId);
          if (!selectedList) {
            throw new TrelloError(t('create.errors.listNotFound', { list: selectedListId }), 'LIST_NOT_FOUND');
          }
          list = selectedList;
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

        const spinner = ora(t('create.creating')).start();
        const card = await client.cards.create(params as CreateCardParams);
        spinner.succeed(t('create.success', { name: card.name }));

        logger.print(chalk.gray(t('create.url', { url: card.shortUrl })));
        if (params.idLabels?.length) {
          logger.print(
            chalk.gray(t('create.labels', { labels: options.labels?.join(', ') }))
          );
        }
        if (params.idMembers?.length) {
          logger.print(
            chalk.gray(
              t('create.members', { members: '@' + options.members?.join(', @') })
            )
          );
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  return create;
}
