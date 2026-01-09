import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import open from 'open';
import { config } from '../utils/config.js';
import { t } from '../utils/i18n.js';
import {
  generateAuthorizationUrl,
  validateToken,
  validateApiKey,
} from '../core/auth/index.js';

export function createAuthCommand(): Command {
  const auth = new Command('auth');

  auth
    .description(t('cli.commands.auth'))
    .addCommand(createApiKeyCommand())
    .addCommand(createOAuthCommand())
    .addCommand(createStatusCommand())
    .addCommand(createLogoutCommand());

  return auth;
}

function createApiKeyCommand(): Command {
  const apikey = new Command('apikey');

  apikey
    .description(t('cli.subcommands.auth.apikey'))
    .action(async () => {
      await handleApiKeyAuth();
    });

  return apikey;
}

function createOAuthCommand(): Command {
  const oauth = new Command('oauth');

  oauth
    .description(t('cli.subcommands.auth.oauth'))
    .action(async () => {
      await handleOAuthAuth();
    });

  return oauth;
}

async function handleOAuthAuth(): Promise<void> {
  console.log(chalk.bold(`\n🔐 ${t('auth.oauth.title')}\n`));

  let apiKey = await config.getOrgApiKey();

  if (!apiKey) {
    console.log(t('auth.oauth.apiKeyExplanation'));
    console.log('');

    apiKey = await input({
      message: t('auth.oauth.enterOrgApiKey'),
      validate: (value) => {
        if (!validateApiKey(value)) {
          return t('auth.oauth.invalidApiKey');
        }
        return true;
      },
    });

    await config.setOrgApiKey(apiKey.trim());
  } else {
    console.log(
      chalk.gray(t('auth.oauth.usingStoredApiKey', { key: apiKey.slice(0, 8) }))
    );
  }

  const authUrl = generateAuthorizationUrl(apiKey, {
    appName: 'Trello CLI',
    scope: 'read,write',
    expiration: 'never',
  });

  console.log('');
  console.log(t('auth.oauth.instructions'));
  console.log(chalk.cyan(`\n${authUrl}\n`));

  const shouldOpen = await confirm({
    message: t('auth.oauth.openBrowser'),
    default: true,
  });

  if (shouldOpen) {
    await open(authUrl);
  }

  const token = await input({
    message: t('auth.oauth.enterToken'),
    validate: (value) => {
      if (!validateToken(value)) {
        return t('auth.oauth.invalidToken');
      }
      return true;
    },
  });

  await config.setOAuthAuth(token.trim(), apiKey.trim());

  console.log(chalk.green(`\n✓ ${t('auth.oauth.success')}`));
  console.log(
    chalk.gray(t('auth.configSaved', { path: config.getPath() }) + '\n')
  );
}

function createStatusCommand(): Command {
  const status = new Command('status');

  status
    .description(t('cli.subcommands.auth.status'))
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
  } else if (mode === 'oauth') {
    const auth = await config.getOAuthAuth();
    if (auth) {
      console.log(t('auth.status.orgApiKey', { key: auth.orgApiKey.slice(0, 8) }));
      console.log(t('auth.status.token', { token: auth.token.slice(0, 8) }));
    }
  }

  console.log(chalk.gray('\n' + t('auth.status.config', { path: config.getPath() }) + '\n'));
}

function createLogoutCommand(): Command {
  const logout = new Command('logout');

  logout
    .description(t('cli.subcommands.auth.logout'))
    .option('-f, --force', t('cli.options.force'))
    .action(async (options: { force?: boolean }) => {
      await handleLogout(options.force ?? false);
    });

  return logout;
}

async function handleLogout(force: boolean): Promise<void> {
  const isAuth = await config.isAuthenticated();

  if (!isAuth) {
    console.log(chalk.yellow(`\n${t('auth.logout.notAuthenticated')}\n`));
    return;
  }

  if (!force) {
    const confirmed = await confirm({
      message: t('auth.logout.confirm'),
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.gray(t('auth.logout.cancelled')));
      return;
    }
  }

  await config.clearAuth();
  console.log(chalk.green(`\n✓ ${t('auth.logout.success')}\n`));
}
