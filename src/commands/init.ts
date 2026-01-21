import { Command } from 'commander';
import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { createProvider, createGitHubProvider } from '../utils/create-provider.js';
import { Cache } from '../core/cache.js';
import { TaskPilotError } from '../utils/errors.js';
import { handleCommandError } from '../utils/error-handler.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { ProviderType } from '../providers/provider.js';
import type { TrelloProvider } from '../providers/trello/index.js';
import type { GitHubProvider } from '../providers/github/index.js';
import type { ColumnConfig } from '../providers/github/types.js';
import type { Label } from '../models/index.js';

const AVAILABLE_PROVIDERS: { type: ProviderType; name: string; available: boolean }[] = [
  { type: 'trello', name: 'Trello', available: true },
  { type: 'github', name: 'GitHub Issues', available: true },
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
        if (providerType === 'github') {
          await handleGitHubInit();
        } else {
          await handleTrelloInit(providerType);
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  return init;
}

async function resolveProvider(providerOption?: ProviderType): Promise<ProviderType> {
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

async function handleTrelloInit(providerType: ProviderType): Promise<void> {
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

async function handleGitHubInit(): Promise<void> {
  const spinner = ora(t('init.github.fetching')).start();

  try {
    const provider = await createGitHubProvider() as GitHubProvider;

    const [repos, currentMember] = await Promise.all([
      provider.listBoards(),
      provider.getCurrentMember(),
    ]);

    if (repos.length === 0) {
      throw new TaskPilotError(
        t('init.github.noRepos'),
        'NO_REPOS'
      );
    }

    spinner.succeed(t('init.github.loaded'));

    const repoId = await select({
      message: t('init.github.selectRepo'),
      choices: repos.map((r) => ({
        name: r.name,
        value: r.id,
        description: r.description || undefined,
      })),
    });

    const selectedRepo = repos.find((r) => r.id === repoId);
    if (!selectedRepo) {
      throw new TaskPilotError(
        t('init.errors.boardNotFound', { id: repoId }),
        'REPO_NOT_FOUND'
      );
    }

    const [owner, repo] = repoId.split('/');
    provider.setRepo(owner, repo);

    spinner.start(t('init.github.fetchingLabels'));

    const allLabels = await provider.listLabels(repoId);

    spinner.stop();

    logger.print('');
    logger.print(chalk.bold(t('init.github.columnConfig')));
    logger.print(t('init.github.columnExplanation'));
    logger.print('');

    const columnConfigs = await configureColumns(allLabels);
    provider.setColumnConfigs(columnConfigs);

    const shouldCreateLabels = columnConfigs.some(
      c => c.labelName && !allLabels.find(l => l.name === c.labelName)
    );

    if (shouldCreateLabels) {
      const createLabels = await confirm({
        message: t('init.github.createMissingLabels'),
        default: true,
      });

      if (createLabels) {
        logger.print(chalk.gray(t('init.github.labelsCreationNote')));
      }
    }

    spinner.start(t('init.fetchingData'));

    const members = await provider.listMembers(repoId);
    const columns = columnConfigs.map((config, index) => ({
      id: config.id,
      name: config.name,
      position: index,
      closed: false,
      _raw: config,
    }));

    const filteredLabels = allLabels.filter(
      l => !columnConfigs.some(c => c.labelName === l.name)
    );

    spinner.stop();

    const cache = new Cache();
    await cache.init('github', selectedRepo.id, selectedRepo.name, currentMember.id);
    cache.setColumns(columns);
    cache.setMembers(members);
    cache.setLabels(filteredLabels);
    cache.setGitHubColumnConfigs(columnConfigs);
    cache.updateSyncTime();
    await cache.save();

    logger.print(
      chalk.green(
        `\n✓ ${t('init.success', { name: selectedRepo.name })}`
      )
    );
    logger.print(
      chalk.gray(t('init.configSaved', { path: `${process.cwd()}/.taskpilot.json` }))
    );
    logger.print(chalk.gray(t('init.provider', { provider: provider.displayName })));
    logger.print(chalk.gray(t('init.loggedAs', { username: currentMember.username })));
    logger.print(chalk.gray(t('init.github.columnsCached', { count: columns.length })));
    logger.print(chalk.gray(t('init.membersCached', { count: members.length })));
    logger.print(chalk.gray(`${t('init.labelsCached', { count: filteredLabels.length })}\n`));
  } catch (error) {
    spinner.fail(t('init.failed'));
    throw error;
  }
}

async function configureColumns(existingLabels: Label[]): Promise<ColumnConfig[]> {
  const labelNames = existingLabels.map(l => l.name);

  const useDefaultConfig = await confirm({
    message: t('init.github.useDefaultColumns'),
    default: true,
  });

  if (useDefaultConfig) {
    return [
      {
        id: 'todo',
        name: 'To Do',
        labelName: 'status:todo',
        isClosedState: false,
      },
      {
        id: 'doing',
        name: 'In Progress',
        labelName: 'status:doing',
        isClosedState: false,
      },
      {
        id: 'done',
        name: 'Done',
        labelName: null,
        isClosedState: true,
      },
    ];
  }

  const columns: ColumnConfig[] = [];

  const todoLabel = await selectOrCreateLabel(
    t('init.github.selectTodoLabel'),
    labelNames,
    'status:todo'
  );
  columns.push({
    id: 'todo',
    name: 'To Do',
    labelName: todoLabel,
    isClosedState: false,
  });

  const doingLabel = await selectOrCreateLabel(
    t('init.github.selectDoingLabel'),
    labelNames,
    'status:doing'
  );
  columns.push({
    id: 'doing',
    name: 'In Progress',
    labelName: doingLabel,
    isClosedState: false,
  });

  const doneUsesClosed = await confirm({
    message: t('init.github.doneUsesClosed'),
    default: true,
  });

  if (doneUsesClosed) {
    columns.push({
      id: 'done',
      name: 'Done',
      labelName: null,
      isClosedState: true,
    });
  } else {
    const doneLabel = await selectOrCreateLabel(
      t('init.github.selectDoneLabel'),
      labelNames,
      'status:done'
    );
    columns.push({
      id: 'done',
      name: 'Done',
      labelName: doneLabel,
      isClosedState: false,
    });
  }

  return columns;
}

async function selectOrCreateLabel(
  message: string,
  existingLabels: string[],
  defaultNew: string
): Promise<string> {
  const CREATE_NEW = '__create_new__';

  const choices = [
    ...existingLabels.map(l => ({ name: l, value: l })),
    { name: chalk.cyan(t('init.github.createNewLabel')), value: CREATE_NEW },
  ];

  const selected = await select({
    message,
    choices,
  });

  if (selected === CREATE_NEW) {
    const newLabel = await input({
      message: t('init.github.enterLabelName'),
      default: defaultNew,
    });
    return newLabel.trim();
  }

  return selected;
}
