import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Resolver } from '../../src/core/resolver.js';
import { Cache } from '../../src/core/cache.js';
import { TrelloNotFoundError } from '../../src/utils/errors.js';

const createMockCache = () => {
  return {
    getMemberByUsername: vi.fn(),
    getMembers: vi.fn().mockReturnValue({}),
    getLabelByName: vi.fn(),
    getLabels: vi.fn().mockReturnValue({}),
  } as unknown as Cache;
};

describe('Resolver', () => {
  let mockCache: ReturnType<typeof createMockCache>;
  let resolver: Resolver;

  beforeEach(() => {
    mockCache = createMockCache();
    resolver = new Resolver(mockCache);
  });

  describe('resolveMembers', () => {
    it('resolves single username to ID', () => {
      mockCache.getMemberByUsername = vi.fn().mockReturnValue({
        id: 'member123',
        username: 'john',
        fullName: 'John Doe',
      });

      const ids = resolver.resolveMembers(['john']);

      expect(ids).toEqual(['member123']);
      expect(mockCache.getMemberByUsername).toHaveBeenCalledWith('john');
    });

    it('resolves multiple usernames', () => {
      mockCache.getMemberByUsername = vi.fn().mockImplementation((username) => {
        const members: Record<string, { id: string; username: string }> = {
          john: { id: 'mem1', username: 'john' },
          jane: { id: 'mem2', username: 'jane' },
        };
        return members[username];
      });

      const ids = resolver.resolveMembers(['john', 'jane']);

      expect(ids).toEqual(['mem1', 'mem2']);
    });

    it('removes @ prefix from usernames', () => {
      mockCache.getMemberByUsername = vi.fn().mockReturnValue({
        id: 'member123',
        username: 'john',
      });

      const ids = resolver.resolveMembers(['@john']);

      expect(ids).toEqual(['member123']);
      expect(mockCache.getMemberByUsername).toHaveBeenCalledWith('john');
    });

    it('lowercases usernames', () => {
      mockCache.getMemberByUsername = vi.fn().mockReturnValue({
        id: 'member123',
        username: 'johndoe',
      });

      resolver.resolveMembers(['JohnDoe']);

      expect(mockCache.getMemberByUsername).toHaveBeenCalledWith('johndoe');
    });

    it('throws TrelloNotFoundError for unknown member', () => {
      mockCache.getMemberByUsername = vi.fn().mockReturnValue(undefined);
      mockCache.getMembers = vi.fn().mockReturnValue({
        john: { id: 'mem1' },
        jane: { id: 'mem2' },
      });

      expect(() => resolver.resolveMembers(['unknown'])).toThrow(
        TrelloNotFoundError
      );
      expect(() => resolver.resolveMembers(['unknown'])).toThrow(
        /Member @unknown.*available: john, jane/
      );
    });

    it('shows no available members in error when cache empty', () => {
      mockCache.getMemberByUsername = vi.fn().mockReturnValue(undefined);
      mockCache.getMembers = vi.fn().mockReturnValue({});

      expect(() => resolver.resolveMembers(['ghost'])).toThrow(
        /available: none/
      );
    });
  });

  describe('resolveLabels', () => {
    it('resolves single label name to ID', () => {
      mockCache.getLabelByName = vi.fn().mockReturnValue({
        id: 'label123',
        name: 'urgent',
        color: 'red',
      });

      const ids = resolver.resolveLabels(['urgent']);

      expect(ids).toEqual(['label123']);
      expect(mockCache.getLabelByName).toHaveBeenCalledWith('urgent');
    });

    it('resolves multiple label names', () => {
      mockCache.getLabelByName = vi.fn().mockImplementation((name) => {
        const labels: Record<string, { id: string; name: string }> = {
          urgent: { id: 'lbl1', name: 'urgent' },
          feature: { id: 'lbl2', name: 'feature' },
        };
        return labels[name];
      });

      const ids = resolver.resolveLabels(['urgent', 'feature']);

      expect(ids).toEqual(['lbl1', 'lbl2']);
    });

    it('lowercases label names', () => {
      mockCache.getLabelByName = vi.fn().mockReturnValue({
        id: 'label123',
        name: 'urgent',
      });

      resolver.resolveLabels(['URGENT']);

      expect(mockCache.getLabelByName).toHaveBeenCalledWith('urgent');
    });

    it('throws TrelloNotFoundError for unknown label', () => {
      mockCache.getLabelByName = vi.fn().mockReturnValue(undefined);
      mockCache.getLabels = vi.fn().mockReturnValue({
        urgent: { id: 'lbl1' },
        feature: { id: 'lbl2' },
      });

      expect(() => resolver.resolveLabels(['unknown'])).toThrow(
        TrelloNotFoundError
      );
      expect(() => resolver.resolveLabels(['unknown'])).toThrow(
        /Label "unknown".*available: urgent, feature/
      );
    });

    it('shows no available labels in error when cache empty', () => {
      mockCache.getLabelByName = vi.fn().mockReturnValue(undefined);
      mockCache.getLabels = vi.fn().mockReturnValue({});

      expect(() => resolver.resolveLabels(['ghost'])).toThrow(
        /available: none/
      );
    });
  });
});
