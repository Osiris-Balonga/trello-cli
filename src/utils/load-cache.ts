import { Cache } from '../core/cache.js';
import { TrelloError } from './errors.js';

export async function loadCache(): Promise<Cache> {
  const cache = new Cache();

  if (!(await cache.exists())) {
    throw new TrelloError(
      'Project not initialized. Run "tt init" first.',
      'NOT_INITIALIZED'
    );
  }

  await cache.load();
  return cache;
}
