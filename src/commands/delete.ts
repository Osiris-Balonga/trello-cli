import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { withCardContext, findCardByNumber } from '../utils/command-context.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

interface DeleteOptions {
  force?: boolean;
  all?: boolean;
}

export function createDeleteCommand(): Command {
  const del = new Command('delete');

  del
    .description(t('cli.commands.delete'))
    .argument('<cardNumber>', t('cli.arguments.cardNumber'))
    .option('-f, --force', t('cli.options.force'))
    .option('-a, --all', t('cli.options.listAll'))
    .action(async (cardNumberStr: string, options: DeleteOptions) => {
      await handleDelete(
        parseInt(cardNumberStr, 10),
        options.force ?? false,
        options.all ?? false
      );
    });

  return del;
}

async function handleDelete(
  cardNumber: number,
  force: boolean,
  all: boolean
): Promise<void> {
  try {
    await withCardContext({ all }, async ({ cache, client, numberedCards, memberId }) => {
      const card = findCardByNumber(
        numberedCards,
        cardNumber,
        memberId,
        'delete.invalidCard'
      );

      const list = cache.getListById(card.idList);
      const listName = list?.name ?? t('common.unknown');

      logger.print(chalk.yellow(`\n⚠️  ${t('delete.warning')}\n`));
      logger.print(`${t('delete.cardLabel')} "${card.name}"`);
      logger.print(`${t('delete.listLabel')} ${listName}`);
      logger.newline();

      if (!force) {
        const confirmed = await confirm({
          message: t('delete.confirm'),
          default: false,
        });

        if (!confirmed) {
          logger.print(t('delete.cancelled'));
          return;
        }
      }

      const spinner = ora(t('delete.deleting')).start();
      await client.cards.delete(card.id);
      spinner.succeed(t('delete.success', { name: card.name }));
    });
  } catch (error) {
    handleCommandError(error);
  }
}
