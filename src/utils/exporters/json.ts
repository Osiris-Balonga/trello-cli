import type { Card } from '../../api/types.js';
import type { Cache } from '../../core/cache.js';
import {
  getListNameById,
  getLabelNameById,
  getMemberUsernameById,
} from './helpers.js';

export function exportToJson(cards: Card[], cache: Cache): string {
  const exportData = {
    boardName: cache.getBoardName(),
    exportDate: new Date().toISOString(),
    cards: cards.map((card) => ({
      name: card.name,
      description: card.desc,
      list: getListNameById(card.idList, cache),
      due: card.due,
      labels: card.idLabels.map((id) => getLabelNameById(id, cache)),
      members: card.idMembers.map((id) => getMemberUsernameById(id, cache)),
      url: card.url,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}
