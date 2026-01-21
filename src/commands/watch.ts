import { Command } from 'commander';
import chalk from 'chalk';
import { withCardContext, findCardByNumber } from '../utils/command-context.js';
import { formatDate, formatDueDate } from '../utils/display.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { Cache } from '../core/cache.js';
import type { Card, TrelloAction } from '../api/types.js';
import type { TrelloClient } from '../api/trello-client.js';

interface WatchOptions {
  interval?: string;
  all?: boolean;
}

interface CardState {
  card: Card;
  comments: TrelloAction[];
  fetchedAt: Date;
}

const MAX_UNCHANGED_BEFORE_BACKOFF = 5;
const MAX_INTERVAL_SECONDS = 120;

export function createWatchCommand(): Command {
  const watch = new Command('watch');

  watch
    .description(t('cli.commands.watch'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-i, --interval <seconds>', t('cli.options.interval'), '30')
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, options: WatchOptions) => {
      await handleWatch(
        parseInt(cardNumberStr, 10),
        parseInt(options.interval || '30', 10),
        options.all ?? false
      );
    });

  return watch;
}

async function fetchCardState(
  client: TrelloClient,
  cardId: string
): Promise<CardState> {
  // Parallel fetch for card and comments
  const [card, comments] = await Promise.all([
    client.cards.get(cardId),
    client.cards.getComments(cardId),
  ]);

  return { card, comments, fetchedAt: new Date() };
}

function getListNameById(listId: string, cache: Cache): string {
  const list = cache.getListById(listId);
  return list?.name ?? t('common.unknown');
}

function displayCardStatus(state: CardState, cache: Cache): void {
  const { card, comments } = state;

  const listName = getListNameById(card.idList, cache);
  logger.print(`${t('watch.status')}: ${listName}`);

  if (card.due) {
    logger.print(`${t('watch.due')}: ${formatDueDate(card.due)}`);
  }

  if (card.idMembers?.length > 0) {
    const members = cache.getMembers();
    const memberNames = card.idMembers.map((id: string) => {
      const member = Object.values(members).find((m) => m.id === id);
      return member ? `@${member.username}` : id;
    });
    logger.print(`${t('watch.members')}: ${memberNames.join(', ')}`);
  }

  logger.print(`${t('watch.comments')}: ${comments.length}`);

  if (comments.length > 0) {
    logger.print(chalk.gray(`\n${t('watch.recentComments')}:`));
    const recentComments = comments.slice(0, 3);
    for (const comment of recentComments) {
      const date = formatDate(comment.date);
      const author = comment.memberCreator?.username || 'unknown';
      const text = comment.data?.text || '';
      const truncatedText =
        text.length > 50 ? `${text.substring(0, 50)}...` : text;
      logger.print(chalk.gray(`  [${date}] @${author}: ${truncatedText}`));
    }
  }

  logger.print(
    chalk.gray(
      `\n${t('watch.lastUpdated')}: ${formatDate(state.fetchedAt.toISOString())}`
    )
  );
}

function hasStateChanged(
  previous: CardState | null,
  current: CardState
): boolean {
  if (!previous) return true;

  // Compare card state
  const cardChanged =
    JSON.stringify(previous.card) !== JSON.stringify(current.card);

  // Compare comment count
  const commentsChanged = previous.comments.length !== current.comments.length;

  return cardChanged || commentsChanged;
}

async function handleWatch(
  cardNumber: number,
  baseIntervalSeconds: number,
  all: boolean
): Promise<void> {
  try {
    await withCardContext({ all }, async ({ cache, client, numberedCards, memberId }) => {
      const card = findCardByNumber(
        numberedCards,
        cardNumber,
        memberId,
        'watch.invalidCard'
      );

      let previousState: CardState | null = null;
      let unchangedCount = 0;
      let currentInterval = baseIntervalSeconds;

      logger.print(
        chalk.bold.cyan(`\n${t('watch.watching')}: "${card.name}"\n`)
      );
      logger.print(chalk.gray(`${t('watch.pressCtrlC')}\n`));

      const poll = async (): Promise<void> => {
        try {
          const currentState = await fetchCardState(client, card.id);

          logger.clear();
          logger.print(
            chalk.bold.cyan(
              `\n${t('watch.watching')}: "${currentState.card.name}"\n`
            )
          );
          logger.print(chalk.gray(`${t('watch.pressCtrlC')}\n`));

          const changed = hasStateChanged(previousState, currentState);

          if (changed) {
            if (previousState) {
              logger.print(chalk.yellow(`${t('watch.changed')}\n`));
            }
            unchangedCount = 0;
            currentInterval = baseIntervalSeconds;
          } else {
            unchangedCount++;

            // Exponential backoff when no changes detected
            if (unchangedCount > MAX_UNCHANGED_BEFORE_BACKOFF) {
              currentInterval = Math.min(
                currentInterval * 1.5,
                MAX_INTERVAL_SECONDS
              );
            }
          }

          displayCardStatus(currentState, cache);
          previousState = currentState;

          // Show backoff info if active
          if (currentInterval > baseIntervalSeconds) {
            logger.print(
              chalk.gray(
                `\n${t('watch.noChangesBackoff', { count: unchangedCount })}`
              )
            );
          }

          logger.print(
            chalk.gray(
              `\n${t('watch.refreshing', { seconds: Math.round(currentInterval) })}...`
            )
          );

          setTimeout(poll, currentInterval * 1000);
        } catch {
          logger.print(chalk.red(t('watch.error')));
          // On error, reset to base interval and retry
          currentInterval = baseIntervalSeconds;
          setTimeout(poll, currentInterval * 1000);
        }
      };

      // Initial fetch
      await poll();

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        logger.print(chalk.gray(`\n\n${t('watch.stopped')}`));
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {});
    });
  } catch (error) {
    handleCommandError(error);
  }
}
