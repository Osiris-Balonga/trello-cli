import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cache } from '../../src/core/cache.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Cache', () => {
  let tempDir: string;
  let cache: Cache;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trello-cli-test-'));
    cache = new Cache(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('exists', () => {
    it('returns false when cache file does not exist', async () => {
      const exists = await cache.exists();
      expect(exists).toBe(false);
    });

    it('returns true when cache file exists', async () => {
      await fs.writeFile(
        path.join(tempDir, '.trello-cli.json'),
        '{}',
        'utf-8'
      );
      const exists = await cache.exists();
      expect(exists).toBe(true);
    });
  });

  describe('init', () => {
    it('creates cache file with board data', async () => {
      await cache.init('board123', 'My Board');

      const exists = await cache.exists();
      expect(exists).toBe(true);

      expect(cache.getBoardId()).toBe('board123');
      expect(cache.getBoardName()).toBe('My Board');
    });

    it('initializes with empty collections', async () => {
      await cache.init('board123', 'My Board');

      expect(cache.getMembers()).toEqual({});
      expect(cache.getLabels()).toEqual({});
      expect(cache.getLists()).toEqual({});
    });
  });

  describe('load', () => {
    it('loads existing cache data', async () => {
      const data = {
        boardId: 'board456',
        boardName: 'Test Board',
        members: {},
        labels: {},
        lists: {},
        lastSync: '2025-01-01T00:00:00.000Z',
      };
      await fs.writeFile(
        path.join(tempDir, '.trello-cli.json'),
        JSON.stringify(data),
        'utf-8'
      );

      await cache.load();

      expect(cache.getBoardId()).toBe('board456');
      expect(cache.getBoardName()).toBe('Test Board');
    });

    it('handles missing file gracefully', async () => {
      await cache.load();

      expect(cache.getBoardId()).toBeNull();
      expect(cache.getData()).toBeNull();
    });
  });

  describe('members', () => {
    it('sets and retrieves members', async () => {
      await cache.init('board123', 'My Board');

      cache.setMembers([
        { id: 'mem1', username: 'john', fullName: 'John Doe' },
        { id: 'mem2', username: 'jane', fullName: 'Jane Doe' },
      ]);

      const members = cache.getMembers();
      expect(Object.keys(members)).toHaveLength(2);
      expect(members.john).toEqual({
        id: 'mem1',
        username: 'john',
        fullName: 'John Doe',
      });
    });

    it('retrieves member by username', async () => {
      await cache.init('board123', 'My Board');

      cache.setMembers([
        { id: 'mem1', username: 'John', fullName: 'John Doe' },
      ]);

      const member = cache.getMemberByUsername('john');
      expect(member?.id).toBe('mem1');
    });

    it('returns undefined for unknown username', async () => {
      await cache.init('board123', 'My Board');
      cache.setMembers([]);

      const member = cache.getMemberByUsername('unknown');
      expect(member).toBeUndefined();
    });
  });

  describe('labels', () => {
    it('sets and retrieves labels', async () => {
      await cache.init('board123', 'My Board');

      cache.setLabels([
        { id: 'lbl1', name: 'urgent', color: 'red' },
        { id: 'lbl2', name: 'feature', color: 'green' },
      ]);

      const labels = cache.getLabels();
      expect(Object.keys(labels)).toHaveLength(2);
    });

    it('retrieves label by name (case-insensitive)', async () => {
      await cache.init('board123', 'My Board');

      cache.setLabels([{ id: 'lbl1', name: 'Urgent', color: 'red' }]);

      const label = cache.getLabelByName('urgent');
      expect(label?.id).toBe('lbl1');
    });

    it('skips labels without names', async () => {
      await cache.init('board123', 'My Board');

      cache.setLabels([
        { id: 'lbl1', name: 'urgent', color: 'red' },
        { id: 'lbl2', name: '', color: 'green' },
      ]);

      const labels = cache.getLabels();
      expect(Object.keys(labels)).toHaveLength(1);
    });
  });

  describe('lists', () => {
    it('sets and retrieves lists', async () => {
      await cache.init('board123', 'My Board');

      const todo = { id: 'list1', name: 'To Do' };
      const doing = { id: 'list2', name: 'Doing' };
      const done = { id: 'list3', name: 'Done' };

      cache.setLists(todo, doing, done);

      const lists = cache.getLists();
      expect(lists.todo).toEqual(todo);
      expect(lists.doing).toEqual(doing);
      expect(lists.done).toEqual(done);
    });

    it('retrieves list by alias', async () => {
      await cache.init('board123', 'My Board');

      cache.setLists(
        { id: 'list1', name: 'To Do' },
        { id: 'list2', name: 'In Progress' },
        { id: 'list3', name: 'Complete' }
      );

      const list = cache.getListByAlias('todo');
      expect(list?.id).toBe('list1');
    });
  });

  describe('sync time', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('updates and retrieves sync time', async () => {
      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
      await cache.init('board123', 'My Board');

      cache.updateSyncTime();

      expect(cache.getLastSync()).toBe('2025-01-15T10:00:00.000Z');
    });

    it('detects stale cache', async () => {
      await cache.init('board123', 'My Board');

      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
      cache.updateSyncTime();

      vi.setSystemTime(new Date('2025-01-17T10:00:00.000Z'));
      expect(cache.isStale(24)).toBe(true);
    });

    it('detects fresh cache', async () => {
      await cache.init('board123', 'My Board');

      vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
      cache.updateSyncTime();

      vi.setSystemTime(new Date('2025-01-15T11:00:00.000Z'));
      expect(cache.isStale(24)).toBe(false);
    });

    it('considers null lastSync as stale', async () => {
      await cache.init('board123', 'My Board');
      expect(cache.isStale()).toBe(true);
    });
  });

  describe('save', () => {
    it('persists data to file', async () => {
      await cache.init('board123', 'My Board');
      cache.setMembers([{ id: 'mem1', username: 'john', fullName: 'John' }]);

      await cache.save();

      const content = await fs.readFile(
        path.join(tempDir, '.trello-cli.json'),
        'utf-8'
      );
      const data = JSON.parse(content);
      expect(data.boardId).toBe('board123');
      expect(data.members.john.id).toBe('mem1');
    });

    it('throws when no data to save', async () => {
      await expect(cache.save()).rejects.toThrow('No cache data to save');
    });
  });
});
