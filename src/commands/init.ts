import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createTrelloClient } from '../utils/create-client.js';
import { Cache } from '../core/cache.js';
import { TrelloError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';

export function createInitCommand(): Command {
  const init = new Command('init');

  init
    .description(t('cli.commands.init'))
    .action(async () => {
      const spinner = ora(t('init.fetching')).start();

      try {
        const client = await createTrelloClient();

        const [boards, currentMember] = await Promise.all([
          client.boards.listByMember(),
          client.members.getMe(),
        ]);

        if (boards.length === 0) {
          throw new TrelloError(
            t('init.errors.noBoards'),
            'NO_BOARDS'
          );
        }

        spinner.succeed(t('init.loaded'));

        const boardId = await select({
          message: t('init.selectBoard'),
          choices: boards.map((b) => ({
            name: b.name,
            value: b.id,
          })),
        });

        const selectedBoard = boards.find((b) => b.id === boardId);
        if (!selectedBoard) {
          throw new TrelloError(
            t('init.errors.boardNotFound', { id: boardId }),
            'BOARD_NOT_FOUND'
          );
        }

        spinner.start(t('init.fetchingData'));

        const [lists, members, labels] = await Promise.all([
          client.lists.listByBoard(boardId),
          client.members.listByBoard(boardId),
          client.labels.listByBoard(boardId),
        ]);

        spinner.stop();

        const cache = new Cache();
        await cache.init(selectedBoard.id, selectedBoard.name, currentMember.id);
        cache.setAllLists(lists);
        cache.setMembers(members);
        cache.setLabels(labels);
        cache.updateSyncTime();
        await cache.save();

        logger.print(
          chalk.green(
            `\n✓ ${t('init.success', { name: selectedBoard.name })}`
          )
        );
        logger.print(
          chalk.gray(t('init.configSaved', { path: `${process.cwd()}/.trello-cli.json` }))
        );
        logger.print(chalk.gray(t('init.loggedAs', { username: currentMember.username })));
        logger.print(chalk.gray(t('init.listsCached', { count: lists.length })));
        logger.print(chalk.gray(t('init.membersCached', { count: members.length })));
        logger.print(chalk.gray(`${t('init.labelsCached', { count: labels.length })}\n`));
      } catch (error) {
        spinner.fail(t('init.failed'));
        handleCommandError(error);
      }
    });

  return init;
}
