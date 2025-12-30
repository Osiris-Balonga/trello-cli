import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { getSupportedLanguages, isValidLanguage } from '../utils/locale.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloValidationError } from '../utils/errors.js';

export function createConfigCommand(): Command {
  const configCmd = new Command('config');

  configCmd.description('Manage CLI configuration');

  configCmd
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Configuration key (language, authMode)')
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
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key')
    .argument('<value>', 'Configuration value')
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
    .description('List all configuration values')
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
