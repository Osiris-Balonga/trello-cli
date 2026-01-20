import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

function formatDate(dateStr: string | null, tFn: typeof t): string {
  if (!dateStr) return chalk.gray(tFn('common.notSet'));

  const date = new Date(dateStr);
  const now = new Date();
  const formatted = date.toLocaleDateString();

  if (date < now) {
    return chalk.red(tFn('show.due.overdue', { date: formatted }));
  } else if (date.toDateString() === now.toDateString()) {
    return chalk.yellow(tFn('show.due.today', { date: formatted }));
  }
  return chalk.white(formatted);
}

function formatLabels(
  labelIds: string[],
  labelsCache: Record<string, { id: string; color: string }>,
  tFn: typeof t
): string {
  if (labelIds.length === 0) return chalk.gray(tFn('common.none'));

  const labelNames = Object.entries(labelsCache)
    .filter(([, label]) => labelIds.includes(label.id))
    .map(([name]) => name);

  if (labelNames.length === 0) return chalk.gray(tFn('common.none'));
  return labelNames.join(', ');
}

function formatMembers(
  memberIds: string[],
  membersCache: Record<string, { id: string; fullName: string }>,
  tFn: typeof t
): string {
  if (memberIds.length === 0) return chalk.gray(tFn('common.none'));

  const memberNames = Object.entries(membersCache)
    .filter(([, member]) => memberIds.includes(member.id))
    .map(([username, member]) => `@${username} (${member.fullName})`);

  if (memberNames.length === 0) return chalk.gray(tFn('common.none'));
  return memberNames.join(', ');
}

interface ShowOptions {
  all?: boolean;
}

export function createShowCommand(): Command {
  const show = new Command('show');

  show
    .description(t('cli.commands.show'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, options: ShowOptions) => {
      try {
        const cache = await loadCache();
        const client = await createTrelloClient();
        const boardId = cache.getBoardId();

        if (!boardId) {
          throw new TrelloError(t('show.errors.notInitialized'), 'NOT_INITIALIZED');
        }

        const spinner = ora(t('show.loading')).start();
        const allCards = await client.cards.listByBoard(boardId);
        const lists = cache.getAllLists();
        const currentMemberId = cache.getCurrentMemberId();
        const memberId = options.all ? undefined : currentMemberId;
        const numberedCards = getNumberedCards(allCards, lists, { memberId });
        spinner.stop();

        const cardNumber = parseInt(cardNumberStr, 10);
        const card = numberedCards.find((c) => c.displayNumber === cardNumber);

        if (!card) {
          throw new TrelloValidationError(
            t('show.errors.invalidCard', { max: numberedCards.length }),
            'cardNumber'
          );
        }
        const labels = cache.getLabels();
        const members = cache.getMembers();
        const cardList = cache.getListById(card.idList);

        logger.print(chalk.bold.cyan(`\n📋 ${card.name}\n`));
        logger.print(chalk.gray('─'.repeat(50)));

        logger.print(`${chalk.bold(t('show.fields.list'))}     ${cardList?.name ?? t('common.unknown')}`);
        logger.print(`${chalk.bold(t('show.fields.due'))}      ${formatDate(card.due, t)}`);
        logger.print(`${chalk.bold(t('show.fields.labels'))}   ${formatLabels(card.idLabels, labels, t)}`);
        logger.print(`${chalk.bold(t('show.fields.members'))}  ${formatMembers(card.idMembers, members, t)}`);

        logger.print(chalk.gray('\n' + '─'.repeat(50)));

        if (card.desc && card.desc.trim()) {
          logger.print(chalk.bold(`\n${t('show.fields.description')}`));
          logger.print(card.desc);
        } else {
          logger.print(chalk.gray(`\n${t('show.fields.noDescription')}`));
        }

        logger.print(chalk.gray('\n' + '─'.repeat(50)));
        logger.print(chalk.gray(`${t('common.url')} ${card.shortUrl}`));
        logger.print(
          chalk.gray(
            t('show.fields.lastActivity', { date: new Date(card.dateLastActivity).toLocaleString() })
          )
        );
        logger.newline();
      } catch (error) {
        handleCommandError(error);
      }
    });

  return show;
}
