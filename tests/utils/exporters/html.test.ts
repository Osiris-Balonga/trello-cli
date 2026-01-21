import { describe, it, expect } from 'vitest';
import { exportToHtml } from '../../../src/utils/exporters/html.js';
import type { Card } from '../../../src/api/types.js';

// Mock the cache
const createMockCache = (boardName = 'Test Board') => ({
  getBoardName: () => boardName,
  getLabels: () => ({
    urgent: { id: 'label-1', name: 'urgent', color: 'red' },
    feature: { id: 'label-2', name: 'feature', color: 'blue' },
  }),
  getMembers: () => ({
    johndoe: { id: 'member-1', fullName: 'John Doe', username: 'johndoe' },
    janedoe: { id: 'member-2', fullName: 'Jane Doe', username: 'janedoe' },
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

describe('exportToHtml', () => {
  describe('HTML escaping', () => {
    it('should escape HTML in card names', () => {
      const cards = [
        createMockCard({ name: '<script>alert("xss")</script>' }),
      ];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;/script&gt;');
    });

    it('should escape HTML in descriptions', () => {
      const cards = [
        createMockCard({
          desc: '<img src=x onerror=alert(1)>',
        }),
      ];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      // The img tag should be escaped
      expect(html).toContain('&lt;img');
    });

    it('should escape HTML in board name', () => {
      const cards = [createMockCard()];
      const cache = createMockCache('<b>Injected</b>');

      const html = exportToHtml(cards, cache as any);

      expect(html).not.toContain('<b>Injected</b>');
      expect(html).toContain('&lt;b&gt;Injected&lt;/b&gt;');
    });

    it('should escape ampersands', () => {
      const cards = [createMockCard({ name: 'Test & Demo' })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('Test &amp; Demo');
    });

    it('should escape quotes', () => {
      const cards = [createMockCard({ name: 'Test "Card"' })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('Test &quot;Card&quot;');
    });
  });

  describe('HTML structure', () => {
    it('should generate valid HTML document', () => {
      const cards = [createMockCard()];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include board name in title', () => {
      const cards = [createMockCard()];
      const cache = createMockCache('My Project');

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('<title>My Project - Export</title>');
    });

    it('should group cards by list', () => {
      const cards = [
        createMockCard({ id: '1', name: 'Card 1', idList: 'list-1' }),
        createMockCard({ id: '2', name: 'Card 2', idList: 'list-2' }),
        createMockCard({ id: '3', name: 'Card 3', idList: 'list-1' }),
      ];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('To Do (2)');
      expect(html).toContain('Done (1)');
    });
  });

  describe('card content', () => {
    it('should include due date when present', () => {
      const cards = [
        createMockCard({ due: '2025-12-31T00:00:00.000Z' }),
      ];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('<strong>Due:</strong>');
      expect(html).toContain('2025-12-31');
    });

    it('should not include due date section when not set', () => {
      const cards = [createMockCard({ due: null })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).not.toContain('<strong>Due:</strong>');
    });

    it('should include labels when present', () => {
      const cards = [createMockCard({ idLabels: ['label-1'] })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('<strong>Labels:</strong>');
      expect(html).toContain('urgent');
    });

    it('should include members when present', () => {
      const cards = [createMockCard({ idMembers: ['member-1'] })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('<strong>Members:</strong>');
      expect(html).toContain('johndoe');
    });

    it('should include description when present', () => {
      const cards = [createMockCard({ desc: 'This is a test description' })];
      const cache = createMockCache();

      const html = exportToHtml(cards, cache as any);

      expect(html).toContain('class="desc"');
      expect(html).toContain('This is a test description');
    });
  });

  describe('empty states', () => {
    it('should handle empty cards array', () => {
      const cache = createMockCache();

      const html = exportToHtml([], cache as any);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Board');
    });
  });
});
