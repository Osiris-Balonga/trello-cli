import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import type { Card } from '../api/types.js';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return chalk.gray('Not set');

  const date = new Date(dateStr);
  const now = new Date();
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (date < now) {
    return chalk.red(`${formatted} (OVERDUE)`);
  } else if (date.toDateString() === now.toDateString()) {
    return chalk.yellow(`${formatted} (TODAY)`);
  }
  return chalk.white(formatted);
}

function formatLabels(
  labelIds: string[],
  labelsCache: Record<string, { id: string; color: string }>
): string {
  if (labelIds.length === 0) return chalk.gray('None');

  const labelNames = Object.entries(labelsCache)
    .filter(([, label]) => labelIds.includes(label.id))
    .map(([name]) => name);

  if (labelNames.length === 0) return chalk.gray('None');
  return labelNames.join(', ');
}

function formatMembers(
  memberIds: string[],
  membersCache: Record<string, { id: string; fullName: string }>
): string {
  if (memberIds.length === 0) return chalk.gray('None');

  const memberNames = Object.entries(membersCache)
    .filter(([, member]) => memberIds.includes(member.id))
    .map(([username, member]) => `@${username} (${member.fullName})`);

  if (memberNames.length === 0) return chalk.gray('None');
  return memberNames.join(', ');
}

function getListName(
  listId: string,
  listsCache: Record<string, { id: string; name: string }>
): string {
  for (const [, list] of Object.entries(listsCache)) {
    if (list.id === listId) return list.name;
  }
  return 'Unknown';
}

export function createShowCommand(): Command {
  const show = new Command('show');

  show
    .description('Show card details')
    .argument('<cardNumber>', 'Card number from list')
    .action(async (cardNumberStr: string) => {
      try {
        const cache = await loadCache();
        const client = await createTrelloClient();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(
            'No board configured. Run "tt init" first.',
            'NOT_INITIALIZED'
          );
        }

        const spinner = ora('Loading card...').start();
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
        const lists = cache.getLists();
        const labels = cache.getLabels();
        const members = cache.getMembers();

        console.log(chalk.bold.cyan(`\n📋 ${card.name}\n`));
        console.log(chalk.gray('─'.repeat(50)));

        console.log(`${chalk.bold('List:')}     ${getListName(card.idList, lists)}`);
        console.log(`${chalk.bold('Due:')}      ${formatDate(card.due)}`);
        console.log(`${chalk.bold('Labels:')}   ${formatLabels(card.idLabels, labels)}`);
        console.log(`${chalk.bold('Members:')}  ${formatMembers(card.idMembers, members)}`);

        console.log(chalk.gray('\n─'.repeat(50)));

        if (card.desc && card.desc.trim()) {
          console.log(chalk.bold('\nDescription:'));
          console.log(card.desc);
        } else {
          console.log(chalk.gray('\nNo description'));
        }

        console.log(chalk.gray('\n─'.repeat(50)));
        console.log(chalk.gray(`URL: ${card.shortUrl}`));
        console.log(
          chalk.gray(
            `Last activity: ${new Date(card.dateLastActivity).toLocaleString()}`
          )
        );
        console.log();
      } catch (error) {
        handleCommandError(error);
      }
    });

  return show;
}
