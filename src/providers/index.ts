export * from './provider.js';
export * from './registry.js';
export { TrelloProvider } from './trello/index.js';
export { GitHubProvider } from './github/index.js';

import { ProviderRegistry } from './registry.js';
import { TrelloProvider } from './trello/index.js';
import { GitHubProvider } from './github/index.js';

ProviderRegistry.register('trello', () => new TrelloProvider());
ProviderRegistry.register('github', () => new GitHubProvider());
