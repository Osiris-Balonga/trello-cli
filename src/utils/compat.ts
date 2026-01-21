import type { Task, Column, Member, Label } from '../models/index.js';
import type {
  TrelloCard,
  TrelloList,
  TrelloMember,
  TrelloLabel,
} from '../providers/trello/types.js';
import { TrelloMapper } from '../providers/trello/mapper.js';

const mapper = new TrelloMapper();

export function cardsToTasks(cards: TrelloCard[]): Task[] {
  return cards.map((card) => mapper.toTask(card));
}

export function listsToColumns(lists: TrelloList[]): Column[] {
  return lists.map((list) => mapper.toColumn(list));
}

export function trelloMembersToMembers(members: TrelloMember[]): Member[] {
  return members.map((member) => mapper.toMember(member));
}

export function trelloLabelsToLabels(labels: TrelloLabel[]): Label[] {
  return labels.map((label) => mapper.toLabel(label));
}

export { TrelloCard, TrelloList, TrelloMember, TrelloLabel };
