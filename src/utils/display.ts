import chalk from 'chalk';
import type { Card, List } from '../api/types.js';

export function displayCardsByList(
  cards: Card[],
  lists: Record<string, List>
): void {
  for (const listAlias of ['todo', 'doing', 'done']) {
    const list = lists[listAlias];
    if (!list) continue;

    const listCards = cards.filter((c) => c.idList === list.id);
    if (listCards.length === 0) continue;

    console.log(chalk.bold(`\n${list.name} (${listCards.length})`));

    listCards.forEach((card, index) => {
      const num = chalk.gray(`${index + 1}.`);
      const checkbox = card.closed ? chalk.gray('[✓]') : '[ ]';
      const title = card.closed ? chalk.gray(card.name) : card.name;

      console.log(`  ${num} ${checkbox} ${title}`);

      if (card.due) {
        const dueDate = new Date(card.due);
        const now = new Date();
        let dueStr = dueDate.toLocaleDateString();

        if (dueDate < now) {
          dueStr = chalk.red(`Due: ${dueStr} (OVERDUE)`);
        } else if (dueDate.toDateString() === now.toDateString()) {
          dueStr = chalk.yellow(`Due: TODAY`);
        } else {
          dueStr = chalk.white(`Due: ${dueStr}`);
        }

        console.log(`      📅 ${dueStr}`);
      }
    });
  }

  console.log(chalk.gray(`\nTotal: ${cards.length} cards\n`));
}
