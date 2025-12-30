import Conf from 'conf';
import { secureStore } from './secure-store.js';

interface PublicConfig {
  language: string;
  authMode: 'apikey' | 'oauth';
  apiKeyConfigured: boolean;
  oauthConfigured: boolean;
}

class ConfigManager {
  private store: Conf<PublicConfig>;

  constructor() {
    this.store = new Conf<PublicConfig>({
      projectName: 'trello-cli',
      defaults: {
        language: 'en',
        authMode: 'apikey',
        apiKeyConfigured: false,
        oauthConfigured: false,
      },
    });
  }

  getLanguage(): string {
    return this.store.get('language', 'en');
  }

  setLanguage(lang: string): void {
    this.store.set('language', lang);
  }

  getAuthMode(): 'apikey' | 'oauth' {
    return this.store.get('authMode', 'apikey');
  }

  setAuthMode(mode: 'apikey' | 'oauth'): void {
    this.store.set('authMode', mode);
  }

  async getApiKeyAuth(): Promise<{ key: string; token: string } | null> {
    if (!this.store.get('apiKeyConfigured')) {
      return null;
    }

    const key = await secureStore.getCredential('apiKey');
    const token = await secureStore.getCredential('token');

    if (!key || !token) {
      this.store.set('apiKeyConfigured', false);
      return null;
    }

    return { key, token };
  }

  async setApiKeyAuth(key: string, token: string): Promise<void> {
    await secureStore.setCredential('apiKey', key);
    await secureStore.setCredential('token', token);

    this.store.set('apiKeyConfigured', true);
    this.store.set('authMode', 'apikey');
  }

  async getOAuthAuth(): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    if (!this.store.get('oauthConfigured')) {
      return null;
    }

    const accessToken = await secureStore.getCredential('oauthAccessToken');
    const refreshToken = await secureStore.getCredential('oauthRefreshToken');

    if (!accessToken) {
      this.store.set('oauthConfigured', false);
      return null;
    }

    return { accessToken, refreshToken: refreshToken || '' };
  }

  async setOAuthAuth(accessToken: string, refreshToken: string): Promise<void> {
    await secureStore.setCredential('oauthAccessToken', accessToken);
    await secureStore.setCredential('oauthRefreshToken', refreshToken);

    this.store.set('oauthConfigured', true);
    this.store.set('authMode', 'oauth');
  }

  async isAuthenticated(): Promise<boolean> {
    const mode = this.getAuthMode();
    if (mode === 'apikey') {
      return (await this.getApiKeyAuth()) !== null;
    } else {
      return (await this.getOAuthAuth()) !== null;
    }
  }

  async clearAuth(): Promise<void> {
    await secureStore.clearAll();
    this.store.set('apiKeyConfigured', false);
    this.store.set('oauthConfigured', false);
  }

  getPath(): string {
    return this.store.path;
  }
}

export const config = new ConfigManager();
