export * from './provider.js';
export * from './registry.js';
export { TrelloProvider } from './trello/index.js';

import { ProviderRegistry } from './registry.js';
import { TrelloProvider } from './trello/index.js';

ProviderRegistry.register('trello', () => new TrelloProvider());
