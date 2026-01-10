import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { getSupportedLanguages, isValidLanguage } from '../utils/locale.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';

export function createConfigCommand(): Command {
  const configCmd = new Command('config');

  configCmd.description(t('cli.commands.config'));

  configCmd
    .command('get')
    .description(t('cli.subcommands.config.get'))
    .argument('<key>', t('cli.arguments.configKey'))
    .action((key: string) => {
      try {
        switch (key) {
          case 'language':
            console.log(t('config.get.language', { lang: config.getLanguage() }));
            break;
          case 'authMode':
            console.log(t('config.get.authMode', { mode: config.getAuthMode() }));
            break;
          default:
            throw new TrelloValidationError(
              t('config.get.unknown', { key }),
              'key'
            );
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  configCmd
    .command('set')
    .description(t('cli.subcommands.config.set'))
    .argument('<key>', t('cli.arguments.configKey'))
    .argument('<value>', t('cli.arguments.configValue'))
    .action((key: string, value: string) => {
      try {
        switch (key) {
          case 'language': {
            if (!isValidLanguage(value)) {
              const supported = getSupportedLanguages().join(', ');
              throw new TrelloValidationError(
                t('config.set.invalidLanguage', { languages: supported }),
                'language'
              );
            }
            config.setLanguage(value);
            console.log(chalk.green(`✓ ${t('config.set.languageUpdated', { lang: value })}`));
            break;
          }
          default:
            throw new TrelloValidationError(
              t('config.set.unknown', { key }),
              'key'
            );
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  configCmd
    .command('list')
    .description(t('cli.subcommands.config.list'))
    .action(() => {
      try {
        console.log(chalk.bold(`\n⚙️  ${t('config.list.title')}\n`));
        console.log(t('config.get.language', { lang: config.getLanguage() }));
        console.log(t('config.get.authMode', { mode: config.getAuthMode() }));
        console.log(chalk.gray(`\n${t('common.configFile')} ${config.getPath()}\n`));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return configCmd;
}
