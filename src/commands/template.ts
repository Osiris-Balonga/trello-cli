import { Command } from 'commander';
import chalk from 'chalk';
import { input, checkbox, select } from '@inquirer/prompts';
import { loadCache } from '../utils/load-cache.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import type { CardTemplate } from '../types/config.js';

export function createTemplateCommand(): Command {
  const template = new Command('template');

  template.description(t('cli.commands.template'));

  template
    .command('create <name>')
    .description(t('cli.subcommands.template.create'))
    .action(async (name: string) => {
      await handleCreateTemplate(name);
    });

  template
    .command('list')
    .description(t('cli.subcommands.template.list'))
    .action(async () => {
      await handleListTemplates();
    });

  template
    .command('show <name>')
    .description(t('cli.subcommands.template.show'))
    .action(async (name: string) => {
      await handleShowTemplate(name);
    });

  template
    .command('delete <name>')
    .description(t('cli.subcommands.template.delete'))
    .action(async (name: string) => {
      await handleDeleteTemplate(name);
    });

  return template;
}

async function handleCreateTemplate(templateName: string): Promise<void> {
  try {
    const cache = await loadCache();

    if (!cache.getBoardId()) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    if (cache.getTemplate(templateName)) {
      logger.print(
        chalk.red(t('template.alreadyExists', { name: templateName }))
      );
      return;
    }

    logger.print(
      chalk.cyan(`\n${t('template.creating', { name: templateName })}\n`)
    );

    const displayName = await input({
      message: t('template.promptName'),
      default: templateName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    });

    const description = await input({
      message: t('template.promptDescription'),
      default: '',
    });

    const labels = cache.getLabels();
    const labelChoices = Object.keys(labels).map((name) => ({
      name,
      value: name,
    }));

    let selectedLabels: string[] = [];
    if (labelChoices.length > 0) {
      selectedLabels = await checkbox({
        message: t('template.promptLabels'),
        choices: labelChoices,
      });
    }

    const lists = cache.getLists();
    const listChoices = Object.entries(lists).map(([alias, list]) => ({
      name: list.name,
      value: alias,
    }));

    const list = await select({
      message: t('template.promptList'),
      choices: listChoices,
      default: 'todo',
    });

    const templateData: CardTemplate = {
      name: displayName,
      description: description || undefined,
      labels: selectedLabels.length > 0 ? selectedLabels : undefined,
      list,
    };

    await cache.saveTemplate(templateName, templateData);
    logger.print(
      chalk.green(`\n✓ ${t('template.created', { name: templateName })}`)
    );
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleListTemplates(): Promise<void> {
  try {
    const cache = await loadCache();

    if (!cache.getBoardId()) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const templates = cache.getTemplates();
    const templateNames = Object.keys(templates);

    if (templateNames.length === 0) {
      logger.print(chalk.gray(t('template.noTemplates')));
      logger.print(chalk.gray(t('template.createHint')));
      return;
    }

    logger.print(chalk.bold(`\n${t('template.listTitle')}\n`));

    for (const [key, tpl] of Object.entries(templates)) {
      logger.print(chalk.cyan(`  ${key}`));
      logger.print(`    ${tpl.name}`);
      if (tpl.labels?.length) {
        logger.print(chalk.gray(`    ${t('template.showLabels')} ${tpl.labels.join(', ')}`));
      }
      if (tpl.list) {
        logger.print(chalk.gray(`    ${t('template.showList')} ${tpl.list}`));
      }
      logger.print('');
    }

    logger.print(chalk.gray(`${t('template.usageHint')}`));
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleShowTemplate(templateName: string): Promise<void> {
  try {
    const cache = await loadCache();

    if (!cache.getBoardId()) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const template = cache.getTemplate(templateName);
    if (!template) {
      logger.print(chalk.red(t('template.notFound', { name: templateName })));
      return;
    }

    logger.print(chalk.bold(`\n${t('template.showTitle', { name: templateName })}\n`));
    logger.print(`${t('template.showName')} ${template.name}`);
    if (template.labels?.length) {
      logger.print(`${t('template.showLabels')} ${template.labels.join(', ')}`);
    }
    if (template.list) {
      logger.print(`${t('template.showList')} ${template.list}`);
    }
    if (template.description) {
      logger.print(`\n${t('template.showDescription')}`);
      logger.print(chalk.gray('─'.repeat(40)));
      logger.print(template.description);
      logger.print(chalk.gray('─'.repeat(40)));
    }
  } catch (error) {
    handleCommandError(error);
  }
}

async function handleDeleteTemplate(templateName: string): Promise<void> {
  try {
    const cache = await loadCache();

    if (!cache.getBoardId()) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    if (!cache.getTemplate(templateName)) {
      logger.print(chalk.red(t('template.notFound', { name: templateName })));
      return;
    }

    await cache.deleteTemplate(templateName);
    logger.print(
      chalk.green(`✓ ${t('template.deleted', { name: templateName })}`)
    );
  } catch (error) {
    handleCommandError(error);
  }
}
