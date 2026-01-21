import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { withCardContext, findCardByNumber } from '../utils/command-context.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface MoveOptions {
  all?: boolean;
}

export function createMoveCommand(): Command {
  const move = new Command('move');

  move
    .description(t('cli.commands.move'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .argument('[list]', t('cli.arguments.listName'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(
      async (
        cardNumberStr: string,
        listName: string | undefined,
        options: MoveOptions
      ) => {
        await handleMove(parseInt(cardNumberStr, 10), listName, options.all ?? false);
      }
    );

  return move;
}

async function handleMove(
  cardNumber: number,
  listName: string | undefined,
  all: boolean
): Promise<void> {
  try {
    await withCardContext({ all }, async ({ cache, client, lists, numberedCards, memberId }) => {
      const card = findCardByNumber(
        numberedCards,
        cardNumber,
        memberId,
        'move.errors.invalidCard'
      );

      let targetList = listName ? cache.getListByName(listName) : undefined;

      if (!listName) {
        const selectedListId = await select({
          message: t('move.prompt', { name: card.name }),
          choices: lists.map((l) => ({
            name: l.name,
            value: l.id,
          })),
        });
        targetList = lists.find((l) => l.id === selectedListId);
      }

      if (!targetList) {
        const availableLists = lists.map((l) => l.name).join(', ');
        throw new TrelloError(
          t('move.errors.listNotFound', { list: listName || '' }) +
            ` (${t('common.available')}: ${availableLists})`,
          'LIST_NOT_FOUND'
        );
      }

      const spinner = ora(t('move.moving', { list: targetList.name })).start();
      await client.cards.move(card.id, targetList.id);

      spinner.succeed(
        t('move.success', { name: card.name, list: targetList.name })
      );
      logger.print(chalk.gray(`${t('common.url')} ${card.shortUrl}`));
    });
  } catch (error) {
    handleCommandError(error);
  }
}
