import { describe, it, expect } from 'vitest';
import { exportToJson } from '../../../src/utils/exporters/json.js';
import type { Card } from '../../../src/api/types.js';

const createMockCache = () => ({
  getBoardName: () => 'Test Board',
  getLabels: () => ({
    urgent: { id: 'label-1', name: 'urgent', color: 'red' },
  }),
  getMembers: () => ({
    johndoe: { id: 'member-1', fullName: 'John Doe', username: 'johndoe' },
  }),
  getAllLists: () => [{ id: 'list-1', name: 'To Do', pos: 1 }],
  getListById: (id: string) =>
    id === 'list-1' ? { id: 'list-1', name: 'To Do', pos: 1 } : undefined,
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

describe('exportToJson', () => {
  describe('JSON structure', () => {
    it('should return valid JSON', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include board name', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.boardName).toBe('Test Board');
    });

    it('should include export timestamp', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.exportDate).toBeDefined();
      expect(() => new Date(parsed.exportDate)).not.toThrow();
    });

    it('should include cards array', () => {
      const cards = [
        createMockCard({ id: '1', name: 'Card 1' }),
        createMockCard({ id: '2', name: 'Card 2' }),
      ];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed.cards)).toBe(true);
      expect(parsed.cards).toHaveLength(2);
    });
  });

  describe('card fields', () => {
    it('should include card name', () => {
      const cards = [createMockCard({ name: 'My Card' })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].name).toBe('My Card');
    });

    it('should include list name', () => {
      const cards = [createMockCard({ idList: 'list-1' })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].list).toBe('To Do');
    });

    it('should include description', () => {
      const cards = [createMockCard({ desc: 'Card description' })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].description).toBe('Card description');
    });

    it('should include due date', () => {
      const cards = [createMockCard({ due: '2025-12-31T00:00:00.000Z' })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].due).toBe('2025-12-31T00:00:00.000Z');
    });

    it('should include labels as names', () => {
      const cards = [createMockCard({ idLabels: ['label-1'] })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].labels).toContain('urgent');
    });

    it('should include members as usernames', () => {
      const cards = [createMockCard({ idMembers: ['member-1'] })];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].members).toContain('johndoe');
    });

    it('should include URL from card.url field', () => {
      const cards = [
        createMockCard({ url: 'https://trello.com/c/xyz' }),
      ];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards[0].url).toBe('https://trello.com/c/xyz');
    });
  });

  describe('empty states', () => {
    it('should handle empty cards array', () => {
      const cache = createMockCache();

      const json = exportToJson([], cache as any);
      const parsed = JSON.parse(json);

      expect(parsed.cards).toHaveLength(0);
      expect(parsed.boardName).toBe('Test Board');
    });
  });

  describe('formatting', () => {
    it('should output pretty-printed JSON', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const json = exportToJson(cards, cache as any);

      // Pretty-printed JSON has newlines
      expect(json).toContain('\n');
    });
  });
});
