import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { formatDate, getNumberedCards } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface CommentOptions {
  list?: boolean;
  all?: boolean;
}

export function createCommentCommand(): Command {
  const comment = new Command('comment');

  comment
    .description(t('cli.commands.comment'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .argument('[text]', t('cli.arguments.text'))
    .option('--list', t('cli.options.listComments'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, text: string | undefined, options: CommentOptions) => {
      if (options.list) {
        await handleListComments(parseInt(cardNumberStr, 10), options.all ?? false);
      } else {
        await handleAddComment(parseInt(cardNumberStr, 10), text, options.all ?? false);
      }
    });

  return comment;
}

async function handleAddComment(cardNumber: number, text?: string, all?: boolean): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    if (numberedCards.length === 0) {
      const message = memberId
        ? t('display.noCardsAvailableAssigned')
        : t('display.noCardsAvailable');
      throw new TrelloValidationError(message, 'cardNumber');
    }

    const card = numberedCards.find((c) => c.displayNumber === cardNumber);

    if (!card) {
      throw new TrelloValidationError(
        t('comment.invalidCard', { max: numberedCards.length }),
        'cardNumber'
      );
    }

    if (!text) {
      logger.print(chalk.cyan(`\n${t('common.card')} "${card.name}"\n`));
      text = await input({
        message: t('comment.enterText'),
      });
    }

    if (!text.trim()) {
      logger.print(chalk.yellow(t('comment.empty')));
      return;
    }

    const spinner = ora(t('comment.adding')).start();
    await client.cards.addComment(card.id, text);
    spinner.succeed(t('comment.success'));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleListComments(cardNumber: number, all?: boolean): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const spinner = ora(t('comment.loading')).start();
    const client = await createTrelloClient();
    const allCards = await client.cards.listByBoard(boardId);
    const lists = cache.getAllLists();
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = all ? undefined : currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    if (numberedCards.length === 0) {
      spinner.stop();
      const message = memberId
        ? t('display.noCardsAvailableAssigned')
        : t('display.noCardsAvailable');
      throw new TrelloValidationError(message, 'cardNumber');
    }

    const card = numberedCards.find((c) => c.displayNumber === cardNumber);

    if (!card) {
      spinner.stop();
      throw new TrelloValidationError(
        t('comment.invalidCard', { max: numberedCards.length }),
        'cardNumber'
      );
    }
    const comments = await client.cards.getComments(card.id);
    spinner.stop();

    logger.print(chalk.bold(`\n${t('comment.title', { name: card.name })}\n`));

    if (comments.length === 0) {
      logger.print(chalk.gray(t('comment.noComments')));
      return;
    }

    for (const comment of comments) {
      const date = formatDate(comment.date);
      const author = comment.memberCreator?.username || 'unknown';
      logger.print(chalk.gray(`[${date}] @${author}:`));
      logger.print(`  ${comment.data.text}\n`);
    }
  } catch (error) {
    handleCommandError(error);
  }
}
