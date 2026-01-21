import { ProviderRegistry } from '../providers/index.js';
import type { TrelloProvider, GitHubProvider } from '../providers/index.js';
import type { TaskProvider } from '../providers/provider.js';
import type { ProviderType } from '../providers/provider.js';
import type { TrelloAuthConfig } from '../providers/trello/types.js';
import type { GitHubAuthConfig } from '../providers/github/types.js';
import { config } from './config.js';
import { TaskPilotAuthError } from './errors.js';

export async function createProvider(providerType: ProviderType = 'trello'): Promise<TaskProvider> {
  const provider = ProviderRegistry.create(providerType);

  if (providerType === 'trello') {
    const trelloProvider = provider as TrelloProvider;
    const auth = await getTrelloAuth();
    trelloProvider.setAuth(auth);
  } else if (providerType === 'github') {
    const githubProvider = provider as GitHubProvider;
    const auth = await getGitHubAuth();
    githubProvider.setAuth(auth);
  }

  await provider.initialize();
  return provider;
}

export async function createGitHubProvider(): Promise<GitHubProvider> {
  const provider = ProviderRegistry.create('github') as GitHubProvider;
  const auth = await getGitHubAuth();
  provider.setAuth(auth);
  await provider.initialize();
  return provider;
}

async function getTrelloAuth(): Promise<TrelloAuthConfig> {
  const authMode = config.getAuthMode();

  if (authMode === 'apikey') {
    const auth = await config.getApiKeyAuth();
    if (!auth) {
      throw new TaskPilotAuthError(
        'Not authenticated. Run "tt auth apikey" first.'
      );
    }

    return {
      type: 'apikey',
      apiKey: auth.key,
      token: auth.token,
    };
  } else {
    const auth = await config.getOAuthAuth();
    if (!auth) {
      throw new TaskPilotAuthError(
        'Not authenticated. Run "tt auth oauth" first.'
      );
    }

    return {
      type: 'oauth',
      token: auth.token,
      orgApiKey: auth.orgApiKey,
    };
  }
}

async function getGitHubAuth(): Promise<GitHubAuthConfig> {
  const auth = await config.getGitHubAuth();
  if (!auth) {
    throw new TaskPilotAuthError(
      'Not authenticated with GitHub. Run "tt auth github pat" or "tt auth github oauth" first.'
    );
  }

  return {
    type: auth.type,
    token: auth.token,
  };
}

// Backwards compatibility
export { createProvider as createTrelloProvider };
