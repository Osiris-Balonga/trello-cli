import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createProvider } from '../utils/create-provider.js';
import { Cache } from '../core/cache.js';
import { TaskPilotError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { ProviderType } from '../providers/provider.js';
import type { TrelloProvider } from '../providers/trello/index.js';

const AVAILABLE_PROVIDERS: { type: ProviderType; name: string; available: boolean }[] = [
  { type: 'trello', name: 'Trello', available: true },
  { type: 'github', name: 'GitHub Issues', available: false },
  { type: 'linear', name: 'Linear', available: false },
];

interface InitOptions {
  provider?: ProviderType;
}

export function createInitCommand(): Command {
  const init = new Command('init');

  init
    .description(t('cli.commands.init'))
    .option('-p, --provider <type>', t('cli.options.provider'))
    .action(async (options: InitOptions) => {
      try {
        const providerType = await resolveProvider(options.provider);
        await handleInit(providerType);
      } catch (error) {
        handleCommandError(error);
      }
    });

  return init;
}

async function resolveProvider(providerOption?: ProviderType): Promise<ProviderType> {
  // If provider specified via flag, validate and use it
  if (providerOption) {
    const provider = AVAILABLE_PROVIDERS.find(p => p.type === providerOption);
    if (!provider) {
      throw new TaskPilotError(
        t('init.errors.unknownProvider', { provider: providerOption }),
        'UNKNOWN_PROVIDER'
      );
    }
    if (!provider.available) {
      throw new TaskPilotError(
        t('init.errors.providerNotAvailable', { provider: provider.name }),
        'PROVIDER_NOT_AVAILABLE'
      );
    }
    return providerOption;
  }

  // Always show interactive selection prompt
  const selectedType = await select({
    message: t('init.selectProvider'),
    choices: AVAILABLE_PROVIDERS.map(p => ({
      name: p.available ? p.name : `${p.name} ${chalk.gray(t('common.comingSoon'))}`,
      value: p.type,
      disabled: !p.available,
    })),
  });

  return selectedType;
}

async function handleInit(providerType: ProviderType): Promise<void> {
  const spinner = ora(t('init.fetching')).start();

  try {
    const provider = await createProvider(providerType) as TrelloProvider;

    const [boards, currentMember] = await Promise.all([
      provider.listBoards(),
      provider.getCurrentMember(),
    ]);

    if (boards.length === 0) {
      throw new TaskPilotError(
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
      throw new TaskPilotError(
        t('init.errors.boardNotFound', { id: boardId }),
        'BOARD_NOT_FOUND'
      );
    }

    spinner.start(t('init.fetchingData'));

    const [columns, members, labels] = await Promise.all([
      provider.getBoardColumns(boardId),
      provider.listMembers(boardId),
      provider.listLabels(boardId),
    ]);

    spinner.stop();

    const cache = new Cache();
    await cache.init(providerType, selectedBoard.id, selectedBoard.name, currentMember.id);
    cache.setColumns(columns);
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
      chalk.gray(t('init.configSaved', { path: `${process.cwd()}/.taskpilot.json` }))
    );
    logger.print(chalk.gray(t('init.provider', { provider: provider.displayName })));
    logger.print(chalk.gray(t('init.loggedAs', { username: currentMember.username })));
    logger.print(chalk.gray(t('init.listsCached', { count: columns.length })));
    logger.print(chalk.gray(t('init.membersCached', { count: members.length })));
    logger.print(chalk.gray(`${t('init.labelsCached', { count: labels.length })}\n`));
  } catch (error) {
    spinner.fail(t('init.failed'));
    throw error;
  }
}
