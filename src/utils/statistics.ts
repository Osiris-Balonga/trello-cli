import type { Card, TrelloAction } from '../api/types.js';
import type { Cache } from '../core/cache.js';

export interface BoardStats {
  cards: {
    total: number;
    created: number;
    completed: number;
    archived: number;
    inProgress: number;
  };
  velocity: {
    cardsPerWeek: number;
    avgCycleTime: number;
  };
  members: Record<string, number>;
  labels: Record<string, number>;
  trends?: {
    productivityChange: number;
    cycleTimeChange: number;
    completionRate: number;
  };
}

export function calculateStats(
  cards: Card[],
  actions: TrelloAction[],
  cache: Cache,
  periodDays: number,
  _memberId?: string
): BoardStats {
  const now = new Date();
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000
  );
  const prevPeriodStart = new Date(
    periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000
  );

  const periodActions = actions.filter((a) => new Date(a.date) >= periodStart);
  const prevPeriodActions = actions.filter((a) => {
    const date = new Date(a.date);
    return date >= prevPeriodStart && date < periodStart;
  });

  const createdInPeriod = periodActions.filter(
    (a) => a.type === 'createCard'
  ).length;
  const createdPrevPeriod = prevPeriodActions.filter(
    (a) => a.type === 'createCard'
  ).length;

  const doneList = cache.getListByAlias('done');
  const completedInPeriod = periodActions.filter(
    (a) => a.type === 'updateCard' && a.data?.listAfter?.id === doneList?.id
  ).length;

  const archivedInPeriod = periodActions.filter(
    (a) => a.type === 'updateCard' && a.data?.card?.closed === true
  ).length;

  const doingList = cache.getListByAlias('doing');
  const inProgress = cards.filter((c) => c.idList === doingList?.id).length;

  const members: Record<string, number> = {};
  const cacheMembers = cache.getMembers();
  for (const card of cards) {
    for (const id of card.idMembers) {
      const member = Object.values(cacheMembers).find((m) => m.id === id);
      if (member) {
        members[member.username] = (members[member.username] || 0) + 1;
      }
    }
  }

  const labels: Record<string, number> = {};
  const cacheLabels = cache.getLabels();
  for (const card of cards) {
    for (const id of card.idLabels) {
      const label = Object.values(cacheLabels).find((l) => l.id === id);
      if (label && label.name) {
        labels[label.name] = (labels[label.name] || 0) + 1;
      }
    }
  }

  const weeks = periodDays / 7;
  const cardsPerWeek = weeks > 0 ? completedInPeriod / weeks : 0;

  const avgCycleTime =
    completedInPeriod > 0 ? periodDays / completedInPeriod : 0;

  const productivityChange =
    createdPrevPeriod > 0
      ? Math.round(
          ((createdInPeriod - createdPrevPeriod) / createdPrevPeriod) * 100
        )
      : 0;

  const completionRate =
    cards.length > 0 ? Math.round((completedInPeriod / cards.length) * 100) : 0;

  return {
    cards: {
      total: cards.length,
      created: createdInPeriod,
      completed: completedInPeriod,
      archived: archivedInPeriod,
      inProgress,
    },
    velocity: {
      cardsPerWeek,
      avgCycleTime,
    },
    members,
    labels,
    trends: {
      productivityChange,
      cycleTimeChange: 0,
      completionRate,
    },
  };
}
