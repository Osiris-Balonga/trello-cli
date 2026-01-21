// Backwards compatibility - re-exports from new provider system
import { TrelloClient } from '../providers/trello/client.js';
import { config } from './config.js';
import { TrelloAuthError } from './errors.js';

export async function createTrelloClient(): Promise<TrelloClient> {
  const authMode = config.getAuthMode();

  if (authMode === 'apikey') {
    const auth = await config.getApiKeyAuth();
    if (!auth) {
      throw new TrelloAuthError(
        'Not authenticated. Run "tt auth apikey" first.'
      );
    }

    return new TrelloClient({
      auth: {
        type: 'apikey',
        apiKey: auth.key,
        token: auth.token,
      },
    });
  } else {
    const auth = await config.getOAuthAuth();
    if (!auth) {
      throw new TrelloAuthError(
        'Not authenticated. Run "tt auth oauth" first.'
      );
    }

    return new TrelloClient({
      auth: {
        type: 'oauth',
        token: auth.token,
        orgApiKey: auth.orgApiKey,
      },
    });
  }
}
