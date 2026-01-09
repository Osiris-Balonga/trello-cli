import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { formatDate } from '../utils/display.js';

interface CommentOptions {
  list?: boolean;
}

export function createCommentCommand(): Command {
  const comment = new Command('comment');

  comment
    .description(t('cli.commands.comment'))
    .argument('<cardNumber>', 'Card number from tt list')
    .argument('[text]', 'Comment text (interactive if omitted)')
    .option('--list', t('cli.options.listComments'))
    .action(async (cardNumberStr: string, text: string | undefined, options: CommentOptions) => {
      if (options.list) {
        await handleListComments(parseInt(cardNumberStr, 10));
      } else {
        await handleAddComment(parseInt(cardNumberStr, 10), text);
      }
    });

  return comment;
}

async function handleAddComment(cardNumber: number, text?: string): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const client = await createTrelloClient();
    const cards = await client.cards.listByBoard(boardId);

    if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
      throw new TrelloValidationError(
        t('comment.invalidCard', { max: cards.length }),
        'cardNumber'
      );
    }

    const card = cards[cardNumber - 1];

    if (!text) {
      console.log(chalk.cyan(`\nCard: "${card.name}"\n`));
      text = await input({
        message: t('comment.enterText'),
      });
    }

    if (!text.trim()) {
      console.log(chalk.yellow(t('comment.empty')));
      return;
    }

    const spinner = ora(t('comment.adding')).start();
    await client.cards.addComment(card.id, text);
    spinner.succeed(t('comment.success'));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleListComments(cardNumber: number): Promise<void> {
  try {
    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const spinner = ora(t('comment.loading')).start();
    const client = await createTrelloClient();
    const cards = await client.cards.listByBoard(boardId);

    if (isNaN(cardNumber) || cardNumber < 1 || cardNumber > cards.length) {
      spinner.stop();
      throw new TrelloValidationError(
        t('comment.invalidCard', { max: cards.length }),
        'cardNumber'
      );
    }

    const card = cards[cardNumber - 1];
    const comments = await client.cards.getComments(card.id);
    spinner.stop();

    console.log(chalk.bold(`\n${t('comment.title', { name: card.name })}\n`));

    if (comments.length === 0) {
      console.log(chalk.gray(t('comment.noComments')));
      return;
    }

    for (const comment of comments) {
      const date = formatDate(comment.date);
      const author = comment.memberCreator?.username || 'unknown';
      console.log(chalk.gray(`[${date}] @${author}:`));
      console.log(`  ${comment.data.text}\n`);
    }
  } catch (error) {
    handleCommandError(error);
  }
}
