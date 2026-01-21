export type TaskStatus = 'open' | 'in_progress' | 'done' | 'archived';

export interface Task {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  columnId: string;
  columnName: string;

  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  dueComplete: boolean;

  assigneeIds: string[];
  labelIds: string[];

  url: string;
  archived: boolean;
  commentCount?: number;

  _raw: unknown;
}

export interface TaskWithRelations extends Task {
  assignees: import('./member.js').Member[];
  labels: import('./label.js').Label[];
}
