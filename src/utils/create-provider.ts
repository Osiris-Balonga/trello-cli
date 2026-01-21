import { ProviderRegistry } from '../providers/index.js';
import type { TrelloProvider } from '../providers/index.js';
import type { TaskProvider } from '../providers/provider.js';
import type { ProviderType } from '../providers/provider.js';
import type { TrelloAuthConfig } from '../providers/trello/types.js';
import { config } from './config.js';
import { TaskPilotAuthError } from './errors.js';

export async function createProvider(providerType: ProviderType = 'trello'): Promise<TaskProvider> {
  const provider = ProviderRegistry.create(providerType);

  if (providerType === 'trello') {
    const trelloProvider = provider as TrelloProvider;
    const auth = await getTrelloAuth();
    trelloProvider.setAuth(auth);
  }

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

// Backwards compatibility
export { createProvider as createTrelloProvider };
