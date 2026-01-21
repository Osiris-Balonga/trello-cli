import type { TaskStatus } from './task.js';

export interface CreateTaskParams {
  title: string;
  description?: string;
  columnId?: string;
  columnName?: string;
  dueDate?: Date;
  assignees?: string[];
  labels?: string[];
  position?: 'top' | 'bottom';
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  columnId?: string;
  columnName?: string;
  dueDate?: Date | null;
  dueComplete?: boolean;
  assignees?: string[];
  labels?: string[];
  archived?: boolean;
}

export interface TaskFilter {
  columnId?: string;
  columnName?: string;
  assignee?: string;
  label?: string;
  status?: TaskStatus;
  archived?: boolean;
}

export interface BatchResult<T> {
  success: T[];
  failed: Array<{ id: string; error: Error }>;
}
