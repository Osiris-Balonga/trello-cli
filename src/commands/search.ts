import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { Card, List } from '../api/types.js';

interface SearchOptions {
  inTitle?: boolean;
  inDesc?: boolean;
  labels?: string;
  members?: string;
  list?: string;
}

export function createSearchCommand(): Command {
  const search = new Command('search');

  search
    .description(t('cli.commands.search'))
    .argument('<query>', t('cli.options.query'))
    .option('--in-title', t('cli.options.inTitle'))
    .option('--in-desc', t('cli.options.inDesc'))
    .option('-l, --labels <names>', t('cli.options.labels'))
    .option('-m, --members <usernames>', t('cli.options.members'))
    .option('--list <alias>', t('cli.options.listFilter'))
    .action(async (query: string, options: SearchOptions) => {
      await handleSearch(query, options);
    });

  return search;
}

async function handleSearch(
  query: string,
  options: SearchOptions
): Promise<void> {
  const spinner = ora(t('search.searching')).start();

  try {
    const cache = await loadCache();
    const client = await createTrelloClient();
    const boardId = cache.getBoardId();

    if (!boardId) {
      spinner.fail();
      logger.print(chalk.red(t('errors.cacheNotFound')));
      return;
    }

    const cards = await client.cards.listByBoard(boardId);
    const queryLower = query.toLowerCase();

    const members = cache.getMembers();
    const labels = cache.getLabels();
    const lists = cache.getLists();

    const filtered = cards.filter((card) => {
      // Text search
      const inTitle = card.name.toLowerCase().includes(queryLower);
      const inDesc = card.desc.toLowerCase().includes(queryLower);

      if (options.inTitle && !inTitle) return false;
      if (options.inDesc && !inDesc) return false;
      if (!options.inTitle && !options.inDesc && !inTitle && !inDesc)
        return false;

      // Label filter
      if (options.labels) {
        const labelNames = options.labels
          .split(',')
          .map((l) => l.trim().toLowerCase());
        const cardLabelIds = card.idLabels;
        const hasLabel = labelNames.some((name) => {
          const label = labels[name];
          return label && cardLabelIds.includes(label.id);
        });
        if (!hasLabel) return false;
      }

      // Member filter
      if (options.members) {
        const memberNames = options.members
          .split(',')
          .map((m) => m.replace('@', '').trim().toLowerCase());
        const cardMemberIds = card.idMembers;
        const hasMember = memberNames.some((name) => {
          const member = members[name];
          return member && cardMemberIds.includes(member.id);
        });
        if (!hasMember) return false;
      }

      // List filter
      if (options.list) {
        const list = lists[options.list.toLowerCase()];
        if (!list || card.idList !== list.id) return false;
      }

      return true;
    });

    spinner.stop();

    if (filtered.length === 0) {
      logger.print(chalk.yellow(t('search.noResults', { query })));
      return;
    }

    logger.print(chalk.green(t('search.found', { count: filtered.length, query })));
    displayFilteredCards(filtered, lists);
  } catch (error) {
    spinner.fail(t('search.failed'));
    handleCommandError(error);
  }
}

function displayFilteredCards(
  cards: Card[],
  lists: Record<string, List>
): void {
  // Group cards by list for better display
  const listOrder = ['todo', 'doing', 'done'];
  const listIdToAlias: Record<string, string> = {};

  for (const alias of listOrder) {
    const list = lists[alias];
    if (list) {
      listIdToAlias[list.id] = alias;
    }
  }

  // Group cards by list
  const groupedByList: Record<string, Card[]> = {};
  for (const card of cards) {
    const alias = listIdToAlias[card.idList] || 'other';
    if (!groupedByList[alias]) {
      groupedByList[alias] = [];
    }
    groupedByList[alias].push(card);
  }

  // Display in order
  for (const alias of [...listOrder, 'other']) {
    const listCards = groupedByList[alias];
    if (!listCards || listCards.length === 0) continue;

    const list = lists[alias];
    const listName = list?.name || 'Other';

    logger.print(chalk.bold(`\n${listName} (${listCards.length})`));

    listCards.forEach((card, index) => {
      const num = chalk.gray(`${index + 1}.`);
      const title = card.name;
      logger.print(`  ${num} ${title}`);

      if (card.due) {
        const dueDate = new Date(card.due);
        const now = new Date();
        let dueStr = dueDate.toLocaleDateString();

        if (dueDate < now) {
          dueStr = chalk.red(`${t('search.due')} ${dueStr} (${t('search.overdue')})`);
        } else if (dueDate.toDateString() === now.toDateString()) {
          dueStr = chalk.yellow(`${t('search.due')} ${t('search.today')}`);
        } else {
          dueStr = chalk.white(`${t('search.due')} ${dueStr}`);
        }

        logger.print(`      📅 ${dueStr}`);
      }
    });
  }

  logger.print(chalk.gray(`\n${t('search.total', { count: cards.length })}\n`));
}
