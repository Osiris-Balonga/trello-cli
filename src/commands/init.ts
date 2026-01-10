import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createTrelloClient } from '../utils/create-client.js';
import { Cache } from '../core/cache.js';
import { TrelloError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';

export function createInitCommand(): Command {
  const init = new Command('init');

  init
    .description(t('cli.commands.init'))
    .action(async () => {
      const spinner = ora(t('init.fetching')).start();

      try {
        const client = await createTrelloClient();
        const boards = await client.boards.listByMember();

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

        if (lists.length < 3) {
          spinner.warn(t('init.lessLists'));
          console.log(
            chalk.yellow(t('init.lessListsWarning'))
          );
        }

        spinner.stop();

        const todo = await select({
          message: t('init.selectTodo'),
          choices: lists.map((l) => ({ name: l.name, value: l })),
        });

        const doing = await select({
          message: t('init.selectDoing'),
          choices: lists.map((l) => ({ name: l.name, value: l })),
        });

        const done = await select({
          message: t('init.selectDone'),
          choices: lists.map((l) => ({ name: l.name, value: l })),
        });

        const cache = new Cache();
        await cache.init(selectedBoard.id, selectedBoard.name);
        cache.setLists(todo, doing, done);
        cache.setMembers(members);
        cache.setLabels(labels);
        cache.updateSyncTime();
        await cache.save();

        console.log(
          chalk.green(
            `\n✓ ${t('init.success', { name: selectedBoard.name })}`
          )
        );
        console.log(
          chalk.gray(t('init.configSaved', { path: `${process.cwd()}/.trello-cli.json` }))
        );
        console.log(chalk.gray(t('init.membersCached', { count: members.length })));
        console.log(chalk.gray(`${t('init.labelsCached', { count: labels.length })}\n`));
      } catch (error) {
        spinner.fail(t('init.failed'));
        handleCommandError(error);
      }
    });

  return init;
}
