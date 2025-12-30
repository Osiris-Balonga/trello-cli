import type { Card } from '../../api/types.js';
import type { Cache } from '../../core/cache.js';
import {
  getLabelNameById,
  getMemberUsernameById,
  groupByList,
} from './helpers.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportToHtml(cards: Card[], cache: Cache): string {
  const boardName = cache.getBoardName() || 'Board';
  const byList = groupByList(cards, cache);

  const listSections = Object.entries(byList)
    .map(([listName, listCards]) => {
      const cardItems = listCards
        .map((card) => {
          const labels = card.idLabels
            .map((id) => getLabelNameById(id, cache))
            .join(', ');
          const members = card.idMembers
            .map((id) => getMemberUsernameById(id, cache))
            .join(', ');
          return `
        <div class="card">
          <h3>${escapeHtml(card.name)}</h3>
          ${card.due ? `<p><strong>Due:</strong> ${card.due}</p>` : ''}
          ${labels ? `<p><strong>Labels:</strong> ${escapeHtml(labels)}</p>` : ''}
          ${members ? `<p><strong>Members:</strong> ${escapeHtml(members)}</p>` : ''}
          ${card.desc ? `<p class="desc">${escapeHtml(card.desc)}</p>` : ''}
        </div>
      `;
        })
        .join('\n');

      return `
      <section class="list">
        <h2>${escapeHtml(listName)} (${listCards.length})</h2>
        ${cardItems}
      </section>
    `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(boardName)} - Export</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #0079bf; }
    .list { margin: 20px 0; padding: 15px; background: #f4f5f7; border-radius: 8px; }
    .card { background: white; padding: 12px; margin: 10px 0; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 8px 0; }
    .desc { color: #666; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(boardName)}</h1>
  <p>Exported on ${new Date().toLocaleDateString()}</p>
  ${listSections}
</body>
</html>`;
}
