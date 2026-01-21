import { describe, it, expect } from 'vitest';
import { exportToCsv } from '../../../src/utils/exporters/csv.js';
import type { Card } from '../../../src/api/types.js';

const createMockCache = () => ({
  getBoardName: () => 'Test Board',
  getLabels: () => ({
    urgent: { id: 'label-1', name: 'urgent', color: 'red' },
    feature: { id: 'label-2', name: 'feature', color: 'blue' },
  }),
  getMembers: () => ({
    johndoe: { id: 'member-1', fullName: 'John Doe', username: 'johndoe' },
  }),
  getAllLists: () => [
    { id: 'list-1', name: 'To Do', pos: 1 },
    { id: 'list-2', name: 'In Progress', pos: 2 },
  ],
  getListById: (id: string) => {
    const lists: Record<string, { id: string; name: string; pos: number }> = {
      'list-1': { id: 'list-1', name: 'To Do', pos: 1 },
      'list-2': { id: 'list-2', name: 'In Progress', pos: 2 },
    };
    return lists[id];
  },
});

const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  name: 'Test Card',
  idList: 'list-1',
  idLabels: [],
  idMembers: [],
  due: null,
  desc: '',
  shortUrl: 'https://trello.com/c/abc123',
  dateLastActivity: '2025-01-01T00:00:00.000Z',
  closed: false,
  pos: 1,
  ...overrides,
});

describe('exportToCsv', () => {
  describe('CSV structure', () => {
    it('should include header row', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('Name');
      expect(lines[0]).toContain('List');
    });

    it('should have one data row per card plus header', () => {
      const cards = [
        createMockCard({ id: '1', name: 'Card 1' }),
        createMockCard({ id: '2', name: 'Card 2' }),
        createMockCard({ id: '3', name: 'Card 3' }),
      ];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);
      const lines = csv.split('\n').filter((l) => l.trim());

      expect(lines.length).toBe(4); // 1 header + 3 data rows
    });
  });

  describe('CSV escaping', () => {
    it('should escape double quotes in card names', () => {
      const cards = [createMockCard({ name: 'Card with "quotes"' })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      // CSV standard: double quotes are escaped by doubling them
      expect(csv).toContain('""quotes""');
    });

    it('should wrap names containing special chars in quotes', () => {
      const cards = [createMockCard({ name: 'Card, with comma' })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      expect(csv).toContain('"Card, with comma"');
    });

    it('should replace newlines with spaces in descriptions', () => {
      const cards = [createMockCard({ desc: 'Line 1\nLine 2' })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      // The CSV exporter replaces newlines with spaces
      expect(csv).toContain('Line 1 Line 2');
    });
  });

  describe('field values', () => {
    it('should include list name', () => {
      const cards = [createMockCard({ idList: 'list-1' })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      expect(csv).toContain('To Do');
    });

    it('should include labels', () => {
      const cards = [createMockCard({ idLabels: ['label-1', 'label-2'] })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      expect(csv).toContain('urgent');
      expect(csv).toContain('feature');
    });

    it('should include members', () => {
      const cards = [createMockCard({ idMembers: ['member-1'] })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      expect(csv).toContain('johndoe');
    });

    it('should include due date when present', () => {
      const cards = [createMockCard({ due: '2025-12-31T00:00:00.000Z' })];
      const cache = createMockCache();

      const csv = exportToCsv(cards, cache as any);

      expect(csv).toContain('2025-12-31');
    });
  });

  describe('empty states', () => {
    it('should return header only for empty cards array', () => {
      const cache = createMockCache();

      const csv = exportToCsv([], cache as any);
      const lines = csv.split('\n').filter((l) => l.trim());

      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('Name');
    });
  });
});
