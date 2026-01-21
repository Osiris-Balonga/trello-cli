import type { Card } from '../../api/types.js';
import type { Cache } from '../../core/cache.js';

export function getListNameById(listId: string, cache: Cache): string {
  const list = cache.getListById(listId);
  return list?.name ?? 'Unknown';
}

export function getLabelNameById(labelId: string, cache: Cache): string {
  const labels = cache.getLabels();
  for (const label of Object.values(labels)) {
    if (label.id === labelId) {
      return label.name || label.color || 'Unnamed';
    }
  }
  return 'Unknown';
}

export function getMemberUsernameById(memberId: string, cache: Cache): string {
  const members = cache.getMembers();
  for (const member of Object.values(members)) {
    if (member.id === memberId) {
      return member.username;
    }
  }
  return 'Unknown';
}

export function groupByList(
  cards: Card[],
  cache: Cache
): Record<string, Card[]> {
  const result: Record<string, Card[]> = {};
  for (const card of cards) {
    const listName = getListNameById(card.idList, cache);
    if (!result[listName]) {
      result[listName] = [];
    }
    result[listName].push(card);
  }
  return result;
}
