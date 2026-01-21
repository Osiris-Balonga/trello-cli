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
  BatchResult,
} from '../models/index.js';

export type ProviderType = 'trello' | 'github' | 'linear';

export interface TaskProvider {
  readonly type: ProviderType;
  readonly displayName: string;

  initialize(): Promise<void>;
  validateAuth(): Promise<boolean>;

  listBoards(): Promise<Board[]>;
  getBoard(boardId: string): Promise<Board>;
  getBoardColumns(boardId: string): Promise<Column[]>;

  listTasks(boardId: string, filter?: TaskFilter): Promise<Task[]>;
  getTask(taskId: string): Promise<Task>;
  createTask(boardId: string, columnId: string, params: CreateTaskParams): Promise<Task>;
  updateTask(taskId: string, params: UpdateTaskParams): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;

  moveTask(taskId: string, columnId: string): Promise<Task>;
  archiveTask(taskId: string): Promise<Task>;
  unarchiveTask(taskId: string): Promise<Task>;

  listComments(taskId: string): Promise<Comment[]>;
  addComment(taskId: string, text: string): Promise<Comment>;

  listMembers(boardId: string): Promise<Member[]>;
  listLabels(boardId: string): Promise<Label[]>;

  addLabel(taskId: string, labelId: string): Promise<void>;
  removeLabel(taskId: string, labelId: string): Promise<void>;
  addMember(taskId: string, memberId: string): Promise<void>;
  removeMember(taskId: string, memberId: string): Promise<void>;

  batchMove?(taskIds: string[], columnId: string): Promise<BatchResult<Task>>;
  batchArchive?(taskIds: string[], archive: boolean): Promise<BatchResult<Task>>;
  batchAddLabel?(taskIds: string[], labelId: string): Promise<BatchResult<Task>>;
  batchAddMember?(taskIds: string[], memberId: string): Promise<BatchResult<Task>>;
}
