import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import { config } from '../utils/config.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import {
  generateAuthorizationUrl,
  validateToken,
  validateApiKey,
  validateGitHubToken,
  requestDeviceCode,
  pollForAccessToken,
  GITHUB_CLIENT_ID,
} from '../core/auth/index.js';
import { GitHubClient } from '../providers/github/client.js';

export function createAuthCommand(): Command {
  const auth = new Command('auth');

  auth
    .description(t('cli.commands.auth'))
    .addCommand(createTrelloAuthCommand())
    .addCommand(createGitHubAuthCommand())
    // Backwards compatibility: tt auth apikey / tt auth oauth still work
    .addCommand(createApiKeyCommand())
    .addCommand(createOAuthCommand())
    .addCommand(createStatusCommand())
    .addCommand(createLogoutCommand());

  return auth;
}

function createTrelloAuthCommand(): Command {
  const trello = new Command('trello');

  trello
    .description(t('cli.subcommands.auth.trello'))
    .addCommand(createApiKeyCommand())
    .addCommand(createOAuthCommand());

  return trello;
}

function createGitHubAuthCommand(): Command {
  const github = new Command('github');

  github
    .description(t('cli.subcommands.auth.github'))
    .addCommand(createGitHubPatCommand())
    .addCommand(createGitHubOAuthCommand());

  return github;
}

function createGitHubPatCommand(): Command {
  const pat = new Command('pat');

  pat
    .description(t('cli.subcommands.auth.githubPat'))
    .action(async () => {
      await handleGitHubPatAuth();
    });

  return pat;
}

function createGitHubOAuthCommand(): Command {
  const oauth = new Command('oauth');

  oauth
    .description(t('cli.subcommands.auth.githubOauth'))
    .action(async () => {
      await handleGitHubOAuthAuth();
    });

  return oauth;
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
  logger.print(chalk.bold(`\n🔐 ${t('auth.oauth.title')}\n`));

  let apiKey = await config.getOrgApiKey();

  if (!apiKey) {
    logger.print(t('auth.oauth.apiKeyExplanation'));
    logger.print('');

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
    logger.print(
      chalk.gray(t('auth.oauth.usingStoredApiKey', { key: apiKey.slice(0, 8) }))
    );
  }

  const authUrl = generateAuthorizationUrl(apiKey, {
    appName: 'Trello CLI',
    scope: 'read,write',
    expiration: 'never',
  });

  logger.print('');
  logger.print(t('auth.oauth.instructions'));
  logger.print(chalk.cyan(`\n${authUrl}\n`));

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

  logger.print(chalk.green(`\n✓ ${t('auth.oauth.success')}`));
  logger.print(
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
  logger.print(chalk.bold(`\n🔐 ${t('auth.title')}\n`));
  logger.print(t('auth.instructions.intro'));
  logger.print(chalk.cyan('https://trello.com/app-key\n'));

  const apiKey = await input({
    message: t('auth.prompts.apiKey'),
    validate: (value) => {
      if (!validateApiKey(value)) {
        return t('auth.validation.apiKeyInvalid');
      }
      return true;
    },
  });

  const authUrl = generateAuthorizationUrl(apiKey.trim(), {
    appName: 'Trello CLI',
    scope: 'read,write',
    expiration: 'never',
  });

  logger.print('');
  logger.print(t('auth.instructions.tokenSteps'));
  logger.print(chalk.cyan(`\n${authUrl}\n`));

  const shouldOpen = await confirm({
    message: t('auth.prompts.openBrowser'),
    default: true,
  });

  if (shouldOpen) {
    await open(authUrl);
  }

  const token = await input({
    message: t('auth.prompts.pasteToken'),
    validate: (value) => {
      if (!validateToken(value)) {
        return t('auth.validation.tokenInvalid');
      }
      return true;
    },
  });

  await config.setApiKeyAuth(apiKey.trim(), token.trim());

  logger.print(chalk.green(`\n✓ ${t('auth.success')}`));
  logger.print(chalk.gray(t('auth.configSaved', { path: config.getPath() }) + '\n'));
}

async function handleGitHubPatAuth(): Promise<void> {
  logger.print(chalk.bold(`\n🔐 ${t('auth.github.pat.title')}\n`));
  logger.print(t('auth.github.pat.instructions'));
  logger.print(chalk.cyan('https://github.com/settings/tokens\n'));
  logger.print(t('auth.github.pat.scopeHint'));
  logger.print('');

  const token = await input({
    message: t('auth.github.pat.enterToken'),
    validate: (value) => {
      if (!validateGitHubToken(value)) {
        return t('auth.github.pat.invalidToken');
      }
      return true;
    },
  });

  const spinner = ora(t('auth.github.validating')).start();

  try {
    const client = new GitHubClient({ auth: { type: 'pat', token: token.trim() } });
    const user = await client.getMe();

    spinner.succeed(t('auth.github.validated', { username: user.login }));

    await config.setGitHubPatAuth(token.trim());

    logger.print(chalk.green(`\n✓ ${t('auth.github.pat.success')}`));
    logger.print(chalk.gray(t('auth.configSaved', { path: config.getPath() }) + '\n'));
  } catch (error) {
    spinner.fail(t('auth.github.validationFailed'));
    throw error;
  }
}

async function handleGitHubOAuthAuth(): Promise<void> {
  logger.print(chalk.bold(`\n🔐 ${t('auth.github.oauth.title')}\n`));

  const spinner = ora(t('auth.github.oauth.requestingCode')).start();

  try {
    const deviceCode = await requestDeviceCode(GITHUB_CLIENT_ID);

    spinner.stop();

    logger.print(t('auth.github.oauth.instructions'));
    logger.print('');
    logger.print(`1. ${t('auth.github.oauth.step1')}`);
    logger.print(chalk.cyan(`   ${deviceCode.verification_uri}`));
    logger.print('');
    logger.print(`2. ${t('auth.github.oauth.step2')}`);
    logger.print(chalk.bold.yellow(`   ${deviceCode.user_code}`));
    logger.print('');

    const shouldOpen = await confirm({
      message: t('auth.github.oauth.openBrowser'),
      default: true,
    });

    if (shouldOpen) {
      await open(deviceCode.verification_uri);
    }

    const pollSpinner = ora(t('auth.github.oauth.waiting')).start();

    const token = await pollForAccessToken(
      GITHUB_CLIENT_ID,
      deviceCode.device_code,
      deviceCode.interval,
      deviceCode.expires_in,
      () => {
        pollSpinner.text = t('auth.github.oauth.waiting');
      }
    );

    pollSpinner.stop();

    const validationSpinner = ora(t('auth.github.validating')).start();
    const client = new GitHubClient({ auth: { type: 'oauth', token } });
    const user = await client.getMe();

    validationSpinner.succeed(t('auth.github.validated', { username: user.login }));

    await config.setGitHubOAuthAuth(token);

    logger.print(chalk.green(`\n✓ ${t('auth.github.oauth.success')}`));
    logger.print(chalk.gray(t('auth.configSaved', { path: config.getPath() }) + '\n'));
  } catch (error) {
    spinner.fail(t('auth.github.oauth.failed'));
    throw error;
  }
}

async function handleAuthStatus(): Promise<void> {
  logger.print(chalk.bold(`\n🔐 ${t('auth.status.title')}\n`));

  // Trello status
  const isTrelloAuth = await config.isAuthenticated();
  const trelloMode = config.getAuthMode();

  logger.print(chalk.bold('Trello:'));
  if (!isTrelloAuth) {
    logger.print(chalk.red(`  ✗ ${t('auth.status.notAuthenticated')}`));
    logger.print(chalk.gray(`  ${t('auth.status.runAuth')}`));
  } else {
    logger.print(chalk.green(`  ✓ ${t('auth.status.authenticated')}`));
    logger.print(`  ${t('auth.status.mode', { mode: trelloMode })}`);

    if (trelloMode === 'apikey') {
      const auth = await config.getApiKeyAuth();
      if (auth) {
        logger.print(`  ${t('auth.status.apiKey', { key: auth.key.slice(0, 8) })}`);
        logger.print(`  ${t('auth.status.token', { token: auth.token.slice(0, 8) })}`);
      }
    } else if (trelloMode === 'oauth') {
      const auth = await config.getOAuthAuth();
      if (auth) {
        logger.print(`  ${t('auth.status.orgApiKey', { key: auth.orgApiKey.slice(0, 8) })}`);
        logger.print(`  ${t('auth.status.token', { token: auth.token.slice(0, 8) })}`);
      }
    }
  }

  logger.print('');

  // GitHub status
  const isGitHubAuth = await config.isGitHubAuthenticated();
  const githubMode = config.getGitHubAuthMode();

  logger.print(chalk.bold('GitHub:'));
  if (!isGitHubAuth) {
    logger.print(chalk.red(`  ✗ ${t('auth.status.notAuthenticated')}`));
    logger.print(chalk.gray(`  ${t('auth.status.runGitHubAuth')}`));
  } else {
    logger.print(chalk.green(`  ✓ ${t('auth.status.authenticated')}`));
    logger.print(`  ${t('auth.status.mode', { mode: githubMode })}`);

    const auth = await config.getGitHubAuth();
    if (auth) {
      logger.print(`  ${t('auth.status.token', { token: auth.token.slice(0, 8) })}`);
    }
  }

  logger.print(chalk.gray('\n' + t('auth.status.config', { path: config.getPath() }) + '\n'));
}

function createLogoutCommand(): Command {
  const logout = new Command('logout');

  logout
    .description(t('cli.subcommands.auth.logout'))
    .option('-f, --force', t('cli.options.force'))
    .option('--trello', t('cli.options.logoutTrello'))
    .option('--github', t('cli.options.logoutGitHub'))
    .action(async (options: { force?: boolean; trello?: boolean; github?: boolean }) => {
      await handleLogout(options.force ?? false, options.trello, options.github);
    });

  return logout;
}

async function handleLogout(
  force: boolean,
  trelloOnly?: boolean,
  githubOnly?: boolean
): Promise<void> {
  const clearBoth = !trelloOnly && !githubOnly;
  const clearTrello = trelloOnly || clearBoth;
  const clearGitHub = githubOnly || clearBoth;

  const isTrelloAuth = clearTrello ? await config.isAuthenticated() : false;
  const isGitHubAuth = clearGitHub ? await config.isGitHubAuthenticated() : false;

  if (!isTrelloAuth && !isGitHubAuth) {
    logger.print(chalk.yellow(`\n${t('auth.logout.notAuthenticated')}\n`));
    return;
  }

  if (!force) {
    const providers: string[] = [];
    if (isTrelloAuth && clearTrello) providers.push('Trello');
    if (isGitHubAuth && clearGitHub) providers.push('GitHub');

    const confirmed = await confirm({
      message: t('auth.logout.confirmProviders', { providers: providers.join(', ') }),
      default: false,
    });

    if (!confirmed) {
      logger.print(chalk.gray(t('auth.logout.cancelled')));
      return;
    }
  }

  if (clearTrello && isTrelloAuth) {
    await config.clearAuth();
    logger.print(chalk.green(`✓ ${t('auth.logout.trelloSuccess')}`));
  }

  if (clearGitHub && isGitHubAuth) {
    await config.clearGitHubAuth();
    logger.print(chalk.green(`✓ ${t('auth.logout.githubSuccess')}`));
  }

  logger.print('');
}
