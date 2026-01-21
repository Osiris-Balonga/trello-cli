import Conf from 'conf';
import { secureStore } from './secure-store.js';

export type TrelloAuthMode = 'apikey' | 'oauth';
export type GitHubAuthMode = 'pat' | 'oauth';

interface PublicConfig {
  language: string;
  authMode: TrelloAuthMode;
  apiKeyConfigured: boolean;
  oauthConfigured: boolean;
  githubAuthMode: GitHubAuthMode;
  githubPatConfigured: boolean;
  githubOauthConfigured: boolean;
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
        githubAuthMode: 'pat',
        githubPatConfigured: false,
        githubOauthConfigured: false,
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
    this.store.set('githubPatConfigured', false);
    this.store.set('githubOauthConfigured', false);
  }

  getPath(): string {
    return this.store.path;
  }

  // GitHub authentication methods

  getGitHubAuthMode(): GitHubAuthMode {
    return this.store.get('githubAuthMode', 'pat');
  }

  setGitHubAuthMode(mode: GitHubAuthMode): void {
    this.store.set('githubAuthMode', mode);
  }

  async getGitHubPatAuth(): Promise<{ token: string } | null> {
    if (!this.store.get('githubPatConfigured')) {
      return null;
    }

    const token = await secureStore.getCredential('githubPatToken');

    if (!token) {
      this.store.set('githubPatConfigured', false);
      return null;
    }

    return { token };
  }

  async setGitHubPatAuth(token: string): Promise<void> {
    await secureStore.setCredential('githubPatToken', token);
    this.store.set('githubPatConfigured', true);
    this.store.set('githubAuthMode', 'pat');
  }

  async getGitHubOAuthAuth(): Promise<{ token: string } | null> {
    if (!this.store.get('githubOauthConfigured')) {
      return null;
    }

    const token = await secureStore.getCredential('githubOauthToken');

    if (!token) {
      this.store.set('githubOauthConfigured', false);
      return null;
    }

    return { token };
  }

  async setGitHubOAuthAuth(token: string): Promise<void> {
    await secureStore.setCredential('githubOauthToken', token);
    this.store.set('githubOauthConfigured', true);
    this.store.set('githubAuthMode', 'oauth');
  }

  async isGitHubAuthenticated(): Promise<boolean> {
    const mode = this.getGitHubAuthMode();
    if (mode === 'pat') {
      return (await this.getGitHubPatAuth()) !== null;
    } else {
      return (await this.getGitHubOAuthAuth()) !== null;
    }
  }

  async getGitHubAuth(): Promise<{ token: string; type: GitHubAuthMode } | null> {
    const mode = this.getGitHubAuthMode();
    if (mode === 'pat') {
      const auth = await this.getGitHubPatAuth();
      return auth ? { token: auth.token, type: 'pat' } : null;
    } else {
      const auth = await this.getGitHubOAuthAuth();
      return auth ? { token: auth.token, type: 'oauth' } : null;
    }
  }

  async clearGitHubAuth(): Promise<void> {
    await secureStore.deleteCredential('githubPatToken');
    await secureStore.deleteCredential('githubOauthToken');
    this.store.set('githubPatConfigured', false);
    this.store.set('githubOauthConfigured', false);
  }
}

export const config = new ConfigManager();
