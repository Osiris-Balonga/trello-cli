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
            console.log(`Language: ${config.getLanguage()}`);
            break;
          case 'authMode':
            console.log(`Auth mode: ${config.getAuthMode()}`);
            break;
          default:
            throw new TrelloValidationError(
              `Unknown config key: ${key}`,
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
                `Invalid language. Supported: ${supported}`,
                'language'
              );
            }
            config.setLanguage(value);
            console.log(chalk.green(`✓ Language updated to: ${value}`));
            break;
          }
          default:
            throw new TrelloValidationError(
              `Unknown config key: ${key}`,
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
        console.log(chalk.bold('\n⚙️  Current Configuration\n'));
        console.log(`Language: ${config.getLanguage()}`);
        console.log(`Auth mode: ${config.getAuthMode()}`);
        console.log(chalk.gray(`\nConfig file: ${config.getPath()}\n`));
      } catch (error) {
        handleCommandError(error);
      }
    });

  return configCmd;
}
