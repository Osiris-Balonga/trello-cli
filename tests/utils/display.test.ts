import { describe, it, expect, vi } from 'vitest';
import {
  formatDate,
  formatDueDate,
  getNumberedCards,
} from '../../src/utils/display.js';
import type { Task } from '../../src/models/task.js';
import type { Column } from '../../src/models/column.js';

// Mock i18n
vi.mock('../../src/utils/i18n.js', () => ({
  t: (key: string) => key,
}));

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    print: vi.fn(),
  },
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'card-1',
  number: 0,
  title: 'Test Card',
  description: '',
  status: 'open',
  columnId: 'list-1',
  columnName: 'To Do',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  dueDate: null,
  dueComplete: false,
  assigneeIds: ['member-1'],
  labelIds: [],
  url: 'https://trello.com/c/abc123',
  archived: false,
  _raw: {},
  ...overrides,
});

const mockLists: Column[] = [
  { id: 'list-1', name: 'To Do', position: 1, closed: false, _raw: {} },
  { id: 'list-2', name: 'In Progress', position: 2, closed: false, _raw: {} },
  { id: 'list-3', name: 'Done', position: 3, closed: false, _raw: {} },
];

describe('display utilities', () => {
  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = formatDate('2025-06-15T14:30:00.000Z');

      expect(result).toContain('2025');
      expect(result).toContain('06');
      expect(result).toContain('15');
    });
  });

  describe('formatDueDate', () => {
    it('should mark past dates as overdue', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const result = formatDueDate(pastDate.toISOString());

      expect(result).toContain('OVERDUE');
    });

    it('should mark today dates', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const result = formatDueDate(today.toISOString());

      expect(result).toContain('TODAY');
    });

    it('should show relative time for this week', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const result = formatDueDate(futureDate.toISOString());

      // Should contain formatted date
      expect(result).toBeTruthy();
    });

    it('should show plain date for far future', () => {
      const farFuture = new Date();
      farFuture.setMonth(farFuture.getMonth() + 3);

      const result = formatDueDate(farFuture.toISOString());

      expect(result).not.toContain('OVERDUE');
      expect(result).not.toContain('TODAY');
    });
  });

  describe('getNumberedCards', () => {
    it('should assign display numbers to cards', () => {
      const tasks = [
        createMockTask({ id: '1' }),
        createMockTask({ id: '2' }),
        createMockTask({ id: '3' }),
      ];

      const numbered = getNumberedCards(tasks, mockLists);

      expect(numbered[0].displayNumber).toBe(1);
      expect(numbered[1].displayNumber).toBe(2);
      expect(numbered[2].displayNumber).toBe(3);
    });

    it('should filter out cards from unknown lists', () => {
      const tasks = [
        createMockTask({ id: '1', columnId: 'list-1' }),
        createMockTask({ id: '2', columnId: 'unknown-list' }),
        createMockTask({ id: '3', columnId: 'list-2' }),
      ];

      const numbered = getNumberedCards(tasks, mockLists);

      expect(numbered).toHaveLength(2);
      expect(numbered.map((c) => c.id)).toEqual(['1', '3']);
    });

    it('should filter by member when memberId provided', () => {
      const tasks = [
        createMockTask({ id: '1', assigneeIds: ['member-1'] }),
        createMockTask({ id: '2', assigneeIds: ['member-2'] }),
        createMockTask({ id: '3', assigneeIds: ['member-1', 'member-2'] }),
      ];

      const numbered = getNumberedCards(tasks, mockLists, {
        memberId: 'member-1',
      });

      expect(numbered).toHaveLength(2);
      expect(numbered.map((c) => c.id)).toEqual(['1', '3']);
    });

    it('should include all cards when no member filter', () => {
      const tasks = [
        createMockTask({ id: '1', assigneeIds: ['member-1'] }),
        createMockTask({ id: '2', assigneeIds: ['member-2'] }),
      ];

      const numbered = getNumberedCards(tasks, mockLists);

      expect(numbered).toHaveLength(2);
    });

    it('should return empty array for empty input', () => {
      const numbered = getNumberedCards([], mockLists);

      expect(numbered).toHaveLength(0);
    });

    it('should maintain sequential numbering after filtering', () => {
      const tasks = [
        createMockTask({ id: '1', assigneeIds: ['member-1'] }),
        createMockTask({ id: '2', assigneeIds: ['member-2'] }),
        createMockTask({ id: '3', assigneeIds: ['member-1'] }),
        createMockTask({ id: '4', assigneeIds: ['member-2'] }),
        createMockTask({ id: '5', assigneeIds: ['member-1'] }),
      ];

      const numbered = getNumberedCards(tasks, mockLists, {
        memberId: 'member-1',
      });

      expect(numbered).toHaveLength(3);
      expect(numbered[0].displayNumber).toBe(1);
      expect(numbered[1].displayNumber).toBe(2);
      expect(numbered[2].displayNumber).toBe(3);
    });
  });
});
