import type { Card } from '../../api/types.js';
import type { Cache } from '../../core/cache.js';
import {
  getLabelNameById,
  getMemberUsernameById,
  groupByList,
} from './helpers.js';

export function exportToMarkdown(cards: Card[], cache: Cache): string {
  const lines = [
    `# ${cache.getBoardName()}`,
    '',
    `Export date: ${new Date().toLocaleDateString()}`,
    '',
  ];

  const byList = groupByList(cards, cache);
  for (const [listName, listCards] of Object.entries(byList)) {
    lines.push(`## ${listName} (${listCards.length} cards)`);
    lines.push('');
    for (const card of listCards) {
      lines.push(`### ${card.name}`);
      if (card.due) lines.push(`- **Due**: ${card.due}`);
      if (card.idLabels.length > 0) {
        lines.push(
          `- **Labels**: ${card.idLabels.map((id) => getLabelNameById(id, cache)).join(', ')}`
        );
      }
      if (card.idMembers.length > 0) {
        lines.push(
          `- **Members**: ${card.idMembers.map((id) => '@' + getMemberUsernameById(id, cache)).join(', ')}`
        );
      }
      if (card.desc) {
        lines.push('- **Description**:');
        lines.push(`  ${card.desc.replace(/\n/g, '\n  ')}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
