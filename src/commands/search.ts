import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
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
    .description('Search cards by keyword')
    .argument('<query>', 'Search query')
    .option('--in-title', 'Search in titles only')
    .option('--in-desc', 'Search in descriptions only')
    .option('-l, --labels <names>', 'Filter by labels (comma-separated)')
    .option('-m, --members <usernames>', 'Filter by members (comma-separated)')
    .option('--list <alias>', 'Filter by list (todo/doing/done)')
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
      console.log(chalk.red(t('errors.cacheNotFound')));
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
      console.log(chalk.yellow(t('search.noResults', { query })));
      return;
    }

    console.log(chalk.green(t('search.found', { count: filtered.length, query })));
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

    console.log(chalk.bold(`\n${listName} (${listCards.length})`));

    listCards.forEach((card, index) => {
      const num = chalk.gray(`${index + 1}.`);
      const title = card.name;
      console.log(`  ${num} ${title}`);

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

        console.log(`      📅 ${dueStr}`);
      }
    });
  }

  console.log(chalk.gray(`\nTotal: ${cards.length} cards\n`));
}
