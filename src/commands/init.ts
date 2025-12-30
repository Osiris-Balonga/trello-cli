import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createTrelloClient } from '../utils/create-client.js';
import { Cache } from '../core/cache.js';
import { TrelloError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';

export function createInitCommand(): Command {
  const init = new Command('init');

  init
    .description('Initialize Trello board for this project')
    .action(async () => {
      const spinner = ora('Fetching your Trello boards...').start();

      try {
        const client = await createTrelloClient();
        const boards = await client.boards.listByMember();

        if (boards.length === 0) {
          throw new TrelloError(
            'No boards found. Create a board on Trello first.',
            'NO_BOARDS'
          );
        }

        spinner.succeed('Boards loaded');

        const boardId = await select({
          message: 'Select a board:',
          choices: boards.map((b) => ({
            name: b.name,
            value: b.id,
          })),
        });

        const selectedBoard = boards.find((b) => b.id === boardId);
        if (!selectedBoard) {
          throw new TrelloError(
            `Board not found (ID: ${boardId})`,
            'BOARD_NOT_FOUND'
          );
        }

        spinner.start('Fetching board data...');

        const [lists, members, labels] = await Promise.all([
          client.lists.listByBoard(boardId),
          client.members.listByBoard(boardId),
          client.labels.listByBoard(boardId),
        ]);

        if (lists.length < 3) {
          spinner.warn('Less than 3 lists found');
          console.log(
            chalk.yellow(
              'You need at least 3 lists (To Do, Doing, Done) for optimal workflow.'
            )
          );
        }

        spinner.stop();

        const todo = await select({
          message: 'Select "To Do" list:',
          choices: lists.map((l) => ({ name: l.name, value: l })),
        });

        const doing = await select({
          message: 'Select "Doing" list:',
          choices: lists.map((l) => ({ name: l.name, value: l })),
        });

        const done = await select({
          message: 'Select "Done" list:',
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
            `\n✓ Board "${selectedBoard.name}" configured for this project`
          )
        );
        console.log(
          chalk.gray(`Config saved to: ${process.cwd()}/.trello-cli.json`)
        );
        console.log(chalk.gray(`Members cached: ${members.length}`));
        console.log(chalk.gray(`Labels cached: ${labels.length}\n`));
      } catch (error) {
        spinner.fail('Failed to initialize');
        handleCommandError(error);
      }
    });

  return init;
}
