import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { config } from '../utils/config.js';

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
      console.log(chalk.yellow('OAuth authentication not yet implemented'));
      console.log('Use: tt auth apikey');
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
  console.log(chalk.bold('\n🔐 Trello API Key Authentication\n'));
  console.log('To obtain your API Key and Token:');
  console.log('1. Open: https://trello.com/app-key');
  console.log('2. Copy your API Key');
  console.log('3. Click on "Token" to generate a token');
  console.log('4. Authorize access');
  console.log('5. Copy the generated token\n');

  const apiKey = await input({
    message: 'Enter your API Key:',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'API Key is required';
      }
      return true;
    },
  });

  const token = await input({
    message: 'Enter your Token:',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Token is required';
      }
      return true;
    },
  });

  await config.setApiKeyAuth(apiKey.trim(), token.trim());

  console.log(chalk.green('\n✓ API Key configured successfully'));
  console.log(chalk.gray(`Config saved to: ${config.getPath()}\n`));
}

async function handleAuthStatus(): Promise<void> {
  const isAuth = await config.isAuthenticated();
  const mode = config.getAuthMode();

  console.log(chalk.bold('\n🔐 Authentication Status\n'));

  if (!isAuth) {
    console.log(chalk.red('✗ Not authenticated'));
    console.log(chalk.gray('Run: tt auth apikey\n'));
    return;
  }

  console.log(chalk.green('✓ Authenticated'));
  console.log(`Mode: ${mode}`);

  if (mode === 'apikey') {
    const auth = await config.getApiKeyAuth();
    if (auth) {
      console.log(`API Key: ${auth.key.slice(0, 8)}...`);
      console.log(`Token: ${auth.token.slice(0, 8)}...`);
    }
  }

  console.log(chalk.gray(`\nConfig: ${config.getPath()}\n`));
}
