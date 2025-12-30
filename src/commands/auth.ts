import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { t } from '../utils/i18n.js';

export function createAuthCommand(): Command {
  const auth = new Command('auth');

  auth
    .description('Authenticate with Trello API')
    .addCommand(createApiKeyCommand())
    .addCommand(createOAuthCommand())
    .addCommand(createStatusCommand());

  return auth;
}

function createApiKeyCommand(): Command {
  const apikey = new Command('apikey');

  apikey
    .description('Authenticate using API Key and Token')
    .action(async () => {
      await handleApiKeyAuth();
    });

  return apikey;
}

function createOAuthCommand(): Command {
  const oauth = new Command('oauth');

  oauth
    .description('Authenticate using OAuth (interactive)')
    .action(async () => {
      console.log(chalk.yellow(t('auth.oauth.notImplemented')));
      console.log(t('auth.oauth.useApiKey'));
    });

  return oauth;
}

function createStatusCommand(): Command {
  const status = new Command('status');

  status
    .description('Check authentication status')
    .action(async () => {
      await handleAuthStatus();
    });

  return status;
}

async function handleApiKeyAuth(): Promise<void> {
  console.log(chalk.bold(`\n🔐 ${t('auth.title')}\n`));
  console.log(t('auth.instructions.intro'));
  console.log(t('auth.instructions.step1'));
  console.log(t('auth.instructions.step2'));
  console.log(t('auth.instructions.step3'));
  console.log(t('auth.instructions.step4'));
  console.log(t('auth.instructions.step5') + '\n');

  const apiKey = await input({
    message: t('auth.prompts.apiKey'),
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return t('auth.validation.apiKeyRequired');
      }
      return true;
    },
  });

  const token = await input({
    message: t('auth.prompts.token'),
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return t('auth.validation.tokenRequired');
      }
      return true;
    },
  });

  await config.setApiKeyAuth(apiKey.trim(), token.trim());

  console.log(chalk.green(`\n✓ ${t('auth.success')}`));
  console.log(chalk.gray(t('auth.configSaved', { path: config.getPath() }) + '\n'));
}

async function handleAuthStatus(): Promise<void> {
  const isAuth = await config.isAuthenticated();
  const mode = config.getAuthMode();

  console.log(chalk.bold(`\n🔐 ${t('auth.status.title')}\n`));

  if (!isAuth) {
    console.log(chalk.red(`✗ ${t('auth.status.notAuthenticated')}`));
    console.log(chalk.gray(t('auth.status.runAuth') + '\n'));
    return;
  }

  console.log(chalk.green(`✓ ${t('auth.status.authenticated')}`));
  console.log(t('auth.status.mode', { mode }));

  if (mode === 'apikey') {
    const auth = await config.getApiKeyAuth();
    if (auth) {
      console.log(t('auth.status.apiKey', { key: auth.key.slice(0, 8) }));
      console.log(t('auth.status.token', { token: auth.token.slice(0, 8) }));
    }
  }

  console.log(chalk.gray('\n' + t('auth.status.config', { path: config.getPath() }) + '\n'));
}
