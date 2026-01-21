import type { TaskProvider } from '../provider.js';
import type {
  Task,
  Board,
  Column,
  Member,
  Label,
  Comment,
  CreateTaskParams,
  UpdateTaskParams,
  TaskFilter,
} from '../../models/index.js';
import { TrelloClient } from './client.js';
import { TrelloMapper } from './mapper.js';
import type { TrelloAuthConfig } from './types.js';

export class TrelloProvider implements TaskProvider {
  readonly type = 'trello' as const;
  readonly displayName = 'Trello';

  private client: TrelloClient | null = null;
  private mapper: TrelloMapper;
  private authConfig: TrelloAuthConfig | null = null;

  constructor() {
    this.mapper = new TrelloMapper();
  }

  setAuth(auth: TrelloAuthConfig): void {
    this.authConfig = auth;
  }

  async initialize(): Promise<void> {
    if (!this.authConfig) {
      throw new Error('Auth config not set. Call setAuth() first.');
    }
    this.client = new TrelloClient({ auth: this.authConfig });
  }

  async validateAuth(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.getMe();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentMember(): Promise<Member> {
    this.ensureClient();
    const member = await this.client!.getMe();
    return this.mapper.toMember(member);
  }

  async listBoards(): Promise<Board[]> {
    this.ensureClient();
    const boards = await this.client!.listBoards();
    return boards.map((b) => this.mapper.toBoard(b));
  }

  async getBoard(boardId: string): Promise<Board> {
    this.ensureClient();
    const board = await this.client!.getBoard(boardId);
    return this.mapper.toBoard(board);
  }

  async getBoardColumns(boardId: string): Promise<Column[]> {
    this.ensureClient();
    const lists = await this.client!.listLists(boardId);
    return lists.map((l) => this.mapper.toColumn(l));
  }

  async listTasks(boardId: string, filter?: TaskFilter): Promise<Task[]> {
    this.ensureClient();
    const cards = await this.client!.listCards(boardId);
    const columns = await this.client!.listLists(boardId);
    const columnMap = new Map(columns.map((c) => [c.id, c.name]));

    let tasks = cards.map((c) => this.mapper.toTask(c, columnMap.get(c.idList)));

    if (filter) {
      if (filter.columnId) {
        tasks = tasks.filter((t) => t.columnId === filter.columnId);
      }
      if (filter.assignee) {
        tasks = tasks.filter((t) => t.assigneeIds.includes(filter.assignee!));
      }
      if (filter.archived !== undefined) {
        tasks = tasks.filter((t) => t.archived === filter.archived);
      }
    }

    return tasks;
  }

  async getTask(taskId: string): Promise<Task> {
    this.ensureClient();
    const card = await this.client!.getCard(taskId);
    const list = await this.client!.getList(card.idList);
    return this.mapper.toTask(card, list.name);
  }

  async createTask(
    _boardId: string,
    columnId: string,
    params: CreateTaskParams
  ): Promise<Task> {
    this.ensureClient();
    const trelloParams = this.mapper.toCreateCardParams(params, columnId);
    const card = await this.client!.createCard(trelloParams);
    return this.mapper.toTask(card);
  }

  async updateTask(taskId: string, params: UpdateTaskParams): Promise<Task> {
    this.ensureClient();
    const trelloParams = this.mapper.toUpdateCardParams(params);
    const card = await this.client!.updateCard(taskId, trelloParams);
    return this.mapper.toTask(card);
  }

  async deleteTask(taskId: string): Promise<void> {
    this.ensureClient();
    await this.client!.deleteCard(taskId);
  }

  async moveTask(taskId: string, columnId: string): Promise<Task> {
    this.ensureClient();
    const card = await this.client!.updateCard(taskId, { idList: columnId });
    return this.mapper.toTask(card);
  }

  async archiveTask(taskId: string): Promise<Task> {
    this.ensureClient();
    const card = await this.client!.archiveCard(taskId);
    return this.mapper.toTask(card);
  }

  async unarchiveTask(taskId: string): Promise<Task> {
    this.ensureClient();
    const card = await this.client!.unarchiveCard(taskId);
    return this.mapper.toTask(card);
  }

  async listComments(taskId: string): Promise<Comment[]> {
    this.ensureClient();
    const actions = await this.client!.getComments(taskId);
    return actions.map((a) => this.mapper.toComment(a));
  }

  async addComment(taskId: string, text: string): Promise<Comment> {
    this.ensureClient();
    const action = await this.client!.addComment(taskId, text);
    return this.mapper.toComment(action);
  }

  async listMembers(boardId: string): Promise<Member[]> {
    this.ensureClient();
    const members = await this.client!.listMembers(boardId);
    return members.map((m) => this.mapper.toMember(m));
  }

  async listLabels(boardId: string): Promise<Label[]> {
    this.ensureClient();
    const labels = await this.client!.listLabels(boardId);
    return labels.map((l) => this.mapper.toLabel(l));
  }

  async addLabel(taskId: string, labelId: string): Promise<void> {
    this.ensureClient();
    await this.client!.addLabel(taskId, labelId);
  }

  async removeLabel(taskId: string, labelId: string): Promise<void> {
    this.ensureClient();
    await this.client!.removeLabel(taskId, labelId);
  }

  async addMember(taskId: string, memberId: string): Promise<void> {
    this.ensureClient();
    await this.client!.addMember(taskId, memberId);
  }

  async removeMember(taskId: string, memberId: string): Promise<void> {
    this.ensureClient();
    await this.client!.removeMember(taskId, memberId);
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
  }
}

export { TrelloClient } from './client.js';
export { TrelloMapper } from './mapper.js';
export * from './types.js';
