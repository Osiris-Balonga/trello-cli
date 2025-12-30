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
    token: string;
    orgApiKey: string;
  } | null> {
    if (!this.store.get('oauthConfigured')) {
      return null;
    }

    const token = await secureStore.getCredential('oauthToken');
    const orgApiKey = await secureStore.getCredential('oauthOrgApiKey');

    if (!token || !orgApiKey) {
      this.store.set('oauthConfigured', false);
      return null;
    }

    return { token, orgApiKey };
  }

  async setOAuthAuth(token: string, orgApiKey: string): Promise<void> {
    await secureStore.setCredential('oauthToken', token);
    await secureStore.setCredential('oauthOrgApiKey', orgApiKey);

    this.store.set('oauthConfigured', true);
    this.store.set('authMode', 'oauth');
  }

  async getOrgApiKey(): Promise<string | null> {
    return secureStore.getCredential('oauthOrgApiKey');
  }

  async setOrgApiKey(apiKey: string): Promise<void> {
    await secureStore.setCredential('oauthOrgApiKey', apiKey);
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
