import { loadCache } from './load-cache.js';
import { createTrelloClient } from './create-client.js';
import { createProvider } from './create-provider.js';
import { getNumberedTasks, type NumberedTask } from './display.js';
import { TaskPilotError, TaskPilotValidationError } from './errors.js';
import { t } from './i18n.js';
import type { Cache } from '../core/cache.js';
import type { TaskProvider } from '../providers/provider.js';
import type { TrelloClient } from '../providers/trello/client.js';
import type { Task, Column } from '../models/index.js';

/**
 * Base context for commands that need board access
 */
export interface BoardContext {
  cache: Cache;
  client: TrelloClient;
  provider: TaskProvider;
  boardId: string;
  lists: Column[];
  columns: Column[];
}

/**
 * Extended context for commands that work with tasks
 */
export interface TaskContext extends BoardContext {
  allTasks: Task[];
  numberedTasks: NumberedTask[];
  memberId: string | undefined;
  isFiltered: boolean;
  // Backwards compatibility aliases
  allCards: Task[];
  numberedCards: NumberedTask[];
}

/**
 * Options for task context loading
 */
export interface TaskContextOptions {
  all?: boolean;
  includeArchived?: boolean;
}

/**
 * Loads board context (cache, client, provider, boardId, columns)
 */
export async function withBoardContext<T>(
  fn: (ctx: BoardContext) => Promise<T>
): Promise<T> {
  const cache = await loadCache();
  const boardId = cache.getBoardId();

  if (!boardId) {
    throw new TaskPilotError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
  }

  const providerType = cache.getProvider();
  const provider = await createProvider(providerType);
  const client = await createTrelloClient();
  const columns = cache.getAllColumns();

  return fn({ cache, client, provider, boardId, lists: columns, columns });
}

/**
 * Loads full task context including numbered tasks
 */
export async function withTaskContext<T>(
  options: TaskContextOptions,
  fn: (ctx: TaskContext) => Promise<T>
): Promise<T> {
  return withBoardContext(async ({ cache, client, provider, boardId, columns }) => {
    const allTasks = await provider.listTasks(boardId);
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = options.all ? undefined : currentMemberId;
    const isFiltered = !options.all && !!currentMemberId;
    const numberedTasks = getNumberedTasks(allTasks, columns, { memberId });

    return fn({
      cache,
      client,
      provider,
      boardId,
      lists: columns,
      columns,
      allTasks,
      numberedTasks,
      memberId,
      isFiltered,
      // Backwards compatibility aliases
      allCards: allTasks,
      numberedCards: numberedTasks,
    });
  });
}

/**
 * Finds a task by display number
 */
export function findTaskByNumber(
  numberedTasks: NumberedTask[],
  taskNumber: number,
  memberId: string | undefined,
  errorKey: string = 'errors.invalidCard'
): NumberedTask {
  if (numberedTasks.length === 0) {
    const message = memberId
      ? t('display.noCardsAvailableAssigned')
      : t('display.noCardsAvailable');
    throw new TaskPilotValidationError(message, 'taskNumber');
  }

  const task = numberedTasks.find((t) => t.displayNumber === taskNumber);
  if (!task) {
    throw new TaskPilotValidationError(
      t(errorKey, { max: numberedTasks.length }),
      'taskNumber'
    );
  }

  return task;
}

/**
 * Validates that tasks are available
 */
export function requireTasks(
  numberedTasks: NumberedTask[],
  memberId: string | undefined
): void {
  if (numberedTasks.length === 0) {
    const message = memberId
      ? t('display.noCardsAvailableAssigned')
      : t('display.noCardsAvailable');
    throw new TaskPilotValidationError(message, 'tasks');
  }
}

/**
 * Resolves multiple task numbers to tasks
 */
export function resolveTaskNumbers(
  numberedTasks: NumberedTask[],
  taskNumbers: string[]
): { targetTasks: NumberedTask[]; targetCards: NumberedTask[]; invalidNumbers: number[] } {
  const taskNums = taskNumbers.map((n) => parseInt(n, 10));
  const taskMap = new Map(numberedTasks.map((t) => [t.displayNumber, t]));

  const invalidNumbers = taskNums.filter((n) => !taskMap.has(n) || isNaN(n));
  const targetTasks = taskNums
    .map((n) => taskMap.get(n))
    .filter((t): t is NumberedTask => t !== undefined);

  return { targetTasks, targetCards: targetTasks, invalidNumbers };
}

// Backwards compatibility aliases
export type CardContext = TaskContext;
export type CardContextOptions = TaskContextOptions;
export const withCardContext = withTaskContext;
export const findCardByNumber = findTaskByNumber;
export const requireCards = requireTasks;
export const resolveCardNumbers = resolveTaskNumbers;
export type NumberedCard = NumberedTask;
