import { Command } from 'commander';
import chalk from 'chalk';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { formatDate, formatDueDate } from '../utils/display.js';
import type { Cache } from '../core/cache.js';

interface WatchOptions {
  interval?: string;
}

export function createWatchCommand(): Command {
  const watch = new Command('watch');

  watch
    .description(t('cli.commands.watch'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-i, --interval <seconds>', t('cli.options.interval'), '30')
    .action(async (cardNumberStr: string, options: WatchOptions) => {
      await handleWatch(
        parseInt(cardNumberStr, 10),
        parseInt(options.interval || '30', 10)
      );
    });

  return watch;
}

async function handleWatch(
  cardNumber: number,
  intervalSeconds: number
): Promise<void> {
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
        t('watch.invalidCard', { max: cards.length }),
        'cardNumber'
      );
    }

    const card = cards[cardNumber - 1];
    let lastState = JSON.stringify(card);

    console.log(
      chalk.bold.cyan(`\n${t('watch.watching')}: "${card.name}"\n`)
    );
    console.log(chalk.gray(`${t('watch.pressCtrlC')}\n`));

    await displayCardStatus(client, card.id, cache);

    const intervalId = setInterval(async () => {
      try {
        const updatedCard = await client.cards.get(card.id);
        const currentState = JSON.stringify(updatedCard);

        console.clear();
        console.log(
          chalk.bold.cyan(`\n${t('watch.watching')}: "${updatedCard.name}"\n`)
        );
        console.log(chalk.gray(`${t('watch.pressCtrlC')}\n`));

        if (currentState !== lastState) {
          console.log(chalk.yellow(`${t('watch.changed')}\n`));
          lastState = currentState;
        }

        await displayCardStatus(client, card.id, cache);

        console.log(
          chalk.gray(
            `\n${t('watch.refreshing', { seconds: intervalSeconds })}...`
          )
        );
      } catch {
        console.log(chalk.red(t('watch.error')));
      }
    }, intervalSeconds * 1000);

    process.on('SIGINT', () => {
      clearInterval(intervalId);
      console.log(chalk.gray(`\n\n${t('watch.stopped')}`));
      process.exit(0);
    });

    await new Promise(() => {});
  } catch (error) {
    handleCommandError(error);
  }
}

function getListNameById(listId: string, cache: Cache): string {
  const lists = cache.getLists();
  for (const list of Object.values(lists)) {
    if (list.id === listId) {
      return list.name;
    }
  }
  return t('common.unknown');
}

async function displayCardStatus(
  client: Awaited<ReturnType<typeof createTrelloClient>>,
  cardId: string,
  cache: Cache
): Promise<void> {
  const card = await client.cards.get(cardId);
  const comments = await client.cards.getComments(cardId);

  const listName = getListNameById(card.idList, cache);
  console.log(`${t('watch.status')}: ${listName}`);

  if (card.due) {
    console.log(`${t('watch.due')}: ${formatDueDate(card.due)}`);
  }

  if (card.idMembers?.length > 0) {
    const members = cache.getMembers();
    const memberNames = card.idMembers.map((id: string) => {
      const member = Object.values(members).find((m) => m.id === id);
      return member ? `@${member.username}` : id;
    });
    console.log(`${t('watch.members')}: ${memberNames.join(', ')}`);
  }

  console.log(`${t('watch.comments')}: ${comments.length}`);

  if (comments.length > 0) {
    console.log(chalk.gray(`\n${t('watch.recentComments')}:`));
    const recentComments = comments.slice(0, 3);
    for (const comment of recentComments) {
      const date = formatDate(comment.date);
      const author = comment.memberCreator?.username || 'unknown';
      const text = comment.data?.text || '';
      const truncatedText =
        text.length > 50 ? `${text.substring(0, 50)}...` : text;
      console.log(chalk.gray(`  [${date}] @${author}: ${truncatedText}`));
    }
  }

  console.log(
    chalk.gray(
      `\n${t('watch.lastUpdated')}: ${formatDate(new Date().toISOString())}`
    )
  );
}
