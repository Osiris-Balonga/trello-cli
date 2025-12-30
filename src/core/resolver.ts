import type { Cache } from './cache.js';
import { TrelloNotFoundError } from '../utils/errors.js';

/**
 * Resolves human-readable names (usernames, labels) to Trello IDs.
 * Uses local cache to avoid API calls.
 */
export class Resolver {
  constructor(private cache: Cache) {}

  /**
   * Resolves a list of usernames to member IDs.
   * @param usernames - List of usernames (without @)
   * @returns List of Trello IDs
   * @throws TrelloNotFoundError if a member doesn't exist
   */
  resolveMembers(usernames: string[]): string[] {
    const ids: string[] = [];

    for (const username of usernames) {
      const clean = username.replace('@', '').toLowerCase();
      const member = this.cache.getMemberByUsername(clean);

      if (!member) {
        const available = Object.keys(this.cache.getMembers()).join(', ');
        throw new TrelloNotFoundError(
          `Member @${clean} (available: ${available || 'none'})`
        );
      }

      ids.push(member.id);
    }

    return ids;
  }

  /**
   * Resolves a list of label names to IDs.
   * @param names - List of label names
   * @returns List of Trello IDs
   * @throws TrelloNotFoundError if a label doesn't exist
   */
  resolveLabels(names: string[]): string[] {
    const ids: string[] = [];

    for (const name of names) {
      const label = this.cache.getLabelByName(name.toLowerCase());

      if (!label) {
        const available = Object.keys(this.cache.getLabels()).join(', ');
        throw new TrelloNotFoundError(
          `Label "${name}" (available: ${available || 'none'})`
        );
      }

      ids.push(label.id);
    }

    return ids;
  }
}
