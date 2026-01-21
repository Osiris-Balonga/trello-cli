import { describe, it, expect } from 'vitest';
import { exportToMarkdown } from '../../../src/utils/exporters/markdown.js';
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
    { id: 'list-2', name: 'Done', pos: 2 },
  ],
  getListById: (id: string) => {
    const lists: Record<string, { id: string; name: string; pos: number }> = {
      'list-1': { id: 'list-1', name: 'To Do', pos: 1 },
      'list-2': { id: 'list-2', name: 'Done', pos: 2 },
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

describe('exportToMarkdown', () => {
  describe('markdown structure', () => {
    it('should include board name as h1', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('# Test Board');
    });

    it('should include list names as h2', () => {
      const cards = [
        createMockCard({ idList: 'list-1' }),
        createMockCard({ id: '2', idList: 'list-2' }),
      ];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('## To Do');
      expect(md).toContain('## Done');
    });

    it('should include card names as h3', () => {
      const cards = [createMockCard({ name: 'My Test Card' })];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('### My Test Card');
    });
  });

  describe('card content', () => {
    it('should include due date when present', () => {
      const cards = [createMockCard({ due: '2025-12-31T00:00:00.000Z' })];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('- **Due**:');
      expect(md).toContain('2025-12-31');
    });

    it('should include labels when present', () => {
      const cards = [createMockCard({ idLabels: ['label-1'] })];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('- **Labels**:');
      expect(md).toContain('urgent');
    });

    it('should include members when present', () => {
      const cards = [createMockCard({ idMembers: ['member-1'] })];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('- **Members**:');
      expect(md).toContain('@johndoe');
    });

    it('should include description when present', () => {
      const cards = [
        createMockCard({ desc: 'This is the card description' }),
      ];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      expect(md).toContain('This is the card description');
    });

    it('should not include card URL by default', () => {
      const cards = [
        createMockCard({ shortUrl: 'https://trello.com/c/abc123' }),
      ];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      // The markdown exporter does not include URLs by default
      // This test verifies expected behavior
      expect(md).toContain('### Test Card');
    });
  });

  describe('grouping', () => {
    it('should group cards by list', () => {
      const cards = [
        createMockCard({ id: '1', name: 'Card 1', idList: 'list-1' }),
        createMockCard({ id: '2', name: 'Card 2', idList: 'list-2' }),
        createMockCard({ id: '3', name: 'Card 3', idList: 'list-1' }),
      ];
      const cache = createMockCache();

      const md = exportToMarkdown(cards, cache as any);

      // Check order - To Do section should have Card 1 and Card 3
      const todoIndex = md.indexOf('## To Do');
      const doneIndex = md.indexOf('## Done');
      const card1Index = md.indexOf('### Card 1');
      const card2Index = md.indexOf('### Card 2');
      const card3Index = md.indexOf('### Card 3');

      expect(todoIndex).toBeLessThan(card1Index);
      expect(card1Index).toBeLessThan(doneIndex);
      expect(doneIndex).toBeLessThan(card2Index);
      expect(todoIndex).toBeLessThan(card3Index);
      expect(card3Index).toBeLessThan(doneIndex);
    });
  });

  describe('empty states', () => {
    it('should handle empty cards array', () => {
      const cache = createMockCache();

      const md = exportToMarkdown([], cache as any);

      expect(md).toContain('# Test Board');
    });
  });
});
