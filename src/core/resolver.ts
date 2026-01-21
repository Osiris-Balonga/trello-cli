import type { Cache } from './cache.js';
import { TaskPilotNotFoundError } from '../utils/errors.js';

/**
 * Resolves human-readable names (usernames, labels, columns) to IDs.
 * Uses local cache to avoid API calls.
 */
export class Resolver {
  constructor(private cache: Cache) {}

  /**
   * Resolves a list of usernames to member IDs.
   * @param usernames - List of usernames (without @)
   * @returns List of member IDs
   * @throws TaskPilotNotFoundError if a member doesn't exist
   */
  resolveMembers(usernames: string[]): string[] {
    const ids: string[] = [];

    for (const username of usernames) {
      const clean = username.replace('@', '').toLowerCase();
      const member = this.cache.getMemberByUsername(clean);

      if (!member) {
        const available = Object.keys(this.cache.getMembers()).join(', ');
        throw new TaskPilotNotFoundError(
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
   * @returns List of label IDs
   * @throws TaskPilotNotFoundError if a label doesn't exist
   */
  resolveLabels(names: string[]): string[] {
    const ids: string[] = [];

    for (const name of names) {
      const label = this.cache.getLabelByName(name.toLowerCase());

      if (!label) {
        const available = Object.keys(this.cache.getLabels()).join(', ');
        throw new TaskPilotNotFoundError(
          `Label "${name}" (available: ${available || 'none'})`
        );
      }

      ids.push(label.id);
    }

    return ids;
  }

  /**
   * Resolves a column name to its ID.
   * @param name - Column name
   * @returns Column ID
   * @throws TaskPilotNotFoundError if column doesn't exist
   */
  resolveColumn(name: string): string {
    const column = this.cache.getColumnByName(name);

    if (!column) {
      const available = this.cache.getAllColumns().map((c) => c.name).join(', ');
      throw new TaskPilotNotFoundError(
        `Column "${name}" (available: ${available || 'none'})`
      );
    }

    return column.id;
  }
}
