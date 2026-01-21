import type {
  Task,
  TaskStatus,
  Board,
  Column,
  Member,
  Label,
  Comment,
  CreateTaskParams,
  UpdateTaskParams,
} from '../../models/index.js';
import type {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloMember,
  TrelloLabel,
  TrelloAction,
  TrelloCreateCardParams,
  TrelloUpdateCardParams,
} from './types.js';

export class TrelloMapper {
  toTask(card: TrelloCard, columnName?: string): Task {
    return {
      id: card.id,
      number: 0,
      title: card.name,
      description: card.desc || null,
      status: this.inferStatus(card),
      columnId: card.idList,
      columnName: columnName ?? '',
      createdAt: new Date(card.dateLastActivity),
      updatedAt: new Date(card.dateLastActivity),
      dueDate: card.due ? new Date(card.due) : null,
      dueComplete: card.dueComplete,
      assigneeIds: card.idMembers,
      labelIds: card.idLabels,
      url: card.url,
      archived: card.closed,
      _raw: card,
    };
  }

  toBoard(board: TrelloBoard): Board {
    return {
      id: board.id,
      name: board.name,
      description: board.desc || null,
      url: board.url,
      closed: board.closed,
      _raw: board,
    };
  }

  toColumn(list: TrelloList): Column {
    return {
      id: list.id,
      name: list.name,
      position: list.pos,
      closed: list.closed,
      _raw: list,
    };
  }

  toMember(member: TrelloMember): Member {
    return {
      id: member.id,
      username: member.username,
      displayName: member.fullName,
      avatarUrl: member.avatarUrl || null,
      email: member.email,
      _raw: member,
      fullName: member.fullName,
    };
  }

  toLabel(label: TrelloLabel): Label {
    return {
      id: label.id,
      name: label.name,
      color: label.color || null,
      _raw: label,
    };
  }

  toComment(action: TrelloAction): Comment {
    return {
      id: action.id,
      text: action.data.text ?? '',
      author: {
        id: action.memberCreator?.id ?? '',
        username: action.memberCreator?.username ?? '',
        displayName: action.memberCreator?.fullName ?? '',
        avatarUrl: null,
        _raw: action.memberCreator,
      },
      createdAt: new Date(action.date),
      _raw: action,
    };
  }

  toCreateCardParams(params: CreateTaskParams, columnId: string): TrelloCreateCardParams {
    return {
      name: params.title,
      idList: columnId,
      desc: params.description,
      due: params.dueDate?.toISOString(),
      idMembers: params.assignees,
      idLabels: params.labels,
      pos: params.position,
    };
  }

  toUpdateCardParams(params: UpdateTaskParams): TrelloUpdateCardParams {
    const result: TrelloUpdateCardParams = {};

    if (params.title !== undefined) result.name = params.title;
    if (params.description !== undefined) result.desc = params.description;
    if (params.columnId !== undefined) result.idList = params.columnId;
    if (params.dueDate !== undefined) {
      result.due = params.dueDate?.toISOString() ?? undefined;
    }
    if (params.dueComplete !== undefined) result.dueComplete = params.dueComplete;
    if (params.assignees !== undefined) result.idMembers = params.assignees;
    if (params.labels !== undefined) result.idLabels = params.labels;
    if (params.archived !== undefined) result.closed = params.archived;

    return result;
  }

  private inferStatus(card: TrelloCard): TaskStatus {
    if (card.closed) return 'archived';
    if (card.dueComplete) return 'done';
    return 'open';
  }
}
