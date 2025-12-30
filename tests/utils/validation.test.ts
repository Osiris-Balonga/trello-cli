import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CreateCardOptionsSchema,
  formatZodErrors,
} from '../../src/utils/validation.js';

describe('CreateCardOptionsSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('desc field', () => {
    it('accepts valid description', () => {
      const result = CreateCardOptionsSchema.safeParse({
        desc: 'Valid description',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.desc).toBe('Valid description');
      }
    });

    it('accepts undefined description', () => {
      const result = CreateCardOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects description over 16384 characters', () => {
      const result = CreateCardOptionsSchema.safeParse({
        desc: 'a'.repeat(16385),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('due field', () => {
    it('accepts valid future date', () => {
      const result = CreateCardOptionsSchema.safeParse({
        due: '2025-02-01',
      });
      expect(result.success).toBe(true);
    });

    it('accepts today date', () => {
      const result = CreateCardOptionsSchema.safeParse({
        due: '2025-01-15',
      });
      expect(result.success).toBe(true);
    });

    it('rejects past date', () => {
      const result = CreateCardOptionsSchema.safeParse({
        due: '2025-01-14',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = CreateCardOptionsSchema.safeParse({
        due: '01-15-2025',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date string', () => {
      const result = CreateCardOptionsSchema.safeParse({
        due: '2025-13-45',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('labels field', () => {
    it('parses comma-separated labels', () => {
      const result = CreateCardOptionsSchema.safeParse({
        labels: 'urgent, feature, bug',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.labels).toEqual(['urgent', 'feature', 'bug']);
      }
    });

    it('trims whitespace and lowercases', () => {
      const result = CreateCardOptionsSchema.safeParse({
        labels: '  URGENT  ,  Feature  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.labels).toEqual(['urgent', 'feature']);
      }
    });

    it('rejects empty label names', () => {
      const result = CreateCardOptionsSchema.safeParse({
        labels: 'urgent,,bug',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('members field', () => {
    it('parses comma-separated members', () => {
      const result = CreateCardOptionsSchema.safeParse({
        members: 'john, jane, bob',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.members).toEqual(['john', 'jane', 'bob']);
      }
    });

    it('removes @ prefix', () => {
      const result = CreateCardOptionsSchema.safeParse({
        members: '@john, @jane',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.members).toEqual(['john', 'jane']);
      }
    });

    it('lowercases usernames', () => {
      const result = CreateCardOptionsSchema.safeParse({
        members: 'JohnDoe, JaneDoe',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.members).toEqual(['johndoe', 'janedoe']);
      }
    });
  });

  describe('list field', () => {
    it('defaults to todo', () => {
      const result = CreateCardOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.list).toBe('todo');
      }
    });

    it('accepts valid list values', () => {
      const lists = ['todo', 'doing', 'done'] as const;
      for (const list of lists) {
        const result = CreateCardOptionsSchema.safeParse({ list });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.list).toBe(list);
        }
      }
    });

    it('rejects invalid list value', () => {
      const result = CreateCardOptionsSchema.safeParse({ list: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});

describe('formatZodErrors', () => {
  it('formats single error', () => {
    const result = CreateCardOptionsSchema.safeParse({ list: 'invalid' });
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain('list');
    }
  });

  it('formats multiple errors', () => {
    const result = CreateCardOptionsSchema.safeParse({
      due: 'invalid',
      list: 'invalid',
    });
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain('due');
      expect(formatted).toContain('list');
    }
  });
});
