import type { Card } from '../../api/types.js';
import type { Cache } from '../../core/cache.js';
import {
  getListNameById,
  getLabelNameById,
  getMemberUsernameById,
} from './helpers.js';

export function exportToCsv(cards: Card[], cache: Cache): string {
  const headers = [
    'Name',
    'List',
    'Due',
    'Labels',
    'Members',
    'Description',
    'URL',
  ];
  const rows = cards.map((card) => [
    `"${card.name.replace(/"/g, '""')}"`,
    getListNameById(card.idList, cache),
    card.due || '',
    card.idLabels.map((id) => getLabelNameById(id, cache)).join(';'),
    card.idMembers.map((id) => getMemberUsernameById(id, cache)).join(';'),
    `"${(card.desc || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    card.url,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
