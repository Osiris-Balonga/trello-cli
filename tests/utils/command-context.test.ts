import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findCardByNumber,
  requireCards,
  resolveCardNumbers,
} from '../../src/utils/command-context.js';
import { TrelloValidationError } from '../../src/utils/errors.js';
import type { NumberedCard } from '../../src/utils/display.js';

// Mock i18n
vi.mock('../../src/utils/i18n.js', () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}: ${JSON.stringify(params)}`;
    }
    return key;
  },
}));

describe('command-context', () => {
  const mockCards: NumberedCard[] = [
    {
      id: 'card-1',
      name: 'Card 1',
      displayNumber: 1,
      idList: 'list-1',
      idLabels: [],
      idMembers: [],
      due: null,
      desc: '',
      shortUrl: 'https://trello.com/c/1',
      dateLastActivity: '2025-01-01',
      closed: false,
      pos: 1,
    },
    {
      id: 'card-2',
      name: 'Card 2',
      displayNumber: 2,
      idList: 'list-1',
      idLabels: [],
      idMembers: [],
      due: null,
      desc: '',
      shortUrl: 'https://trello.com/c/2',
      dateLastActivity: '2025-01-01',
      closed: false,
      pos: 2,
    },
    {
      id: 'card-3',
      name: 'Card 3',
      displayNumber: 3,
      idList: 'list-2',
      idLabels: [],
      idMembers: [],
      due: null,
      desc: '',
      shortUrl: 'https://trello.com/c/3',
      dateLastActivity: '2025-01-01',
      closed: false,
      pos: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findCardByNumber', () => {
    it('should find a card by display number', () => {
      const card = findCardByNumber(mockCards, 2, undefined);
      expect(card.id).toBe('card-2');
      expect(card.name).toBe('Card 2');
    });

    it('should throw when card number is not found', () => {
      expect(() => findCardByNumber(mockCards, 99, undefined)).toThrow(
        TrelloValidationError
      );
    });

    it('should throw when cards array is empty', () => {
      expect(() => findCardByNumber([], 1, undefined)).toThrow(
        TrelloValidationError
      );
    });

    it('should throw different message for filtered view', () => {
      expect(() => findCardByNumber([], 1, 'member-123')).toThrow(
        TrelloValidationError
      );
    });

    it('should use custom error key', () => {
      expect(() =>
        findCardByNumber(mockCards, 99, undefined, 'custom.error')
      ).toThrow(TrelloValidationError);
    });
  });

  describe('requireCards', () => {
    it('should not throw when cards exist', () => {
      expect(() => requireCards(mockCards, undefined)).not.toThrow();
    });

    it('should throw when no cards available', () => {
      expect(() => requireCards([], undefined)).toThrow(TrelloValidationError);
    });

    it('should throw with member-specific message when filtered', () => {
      expect(() => requireCards([], 'member-123')).toThrow(
        TrelloValidationError
      );
    });
  });

  describe('resolveCardNumbers', () => {
    it('should resolve valid card numbers to cards', () => {
      const { targetCards, invalidNumbers } = resolveCardNumbers(mockCards, [
        '1',
        '3',
      ]);

      expect(targetCards).toHaveLength(2);
      expect(targetCards[0].id).toBe('card-1');
      expect(targetCards[1].id).toBe('card-3');
      expect(invalidNumbers).toHaveLength(0);
    });

    it('should identify invalid card numbers', () => {
      const { targetCards, invalidNumbers } = resolveCardNumbers(mockCards, [
        '1',
        '99',
        '100',
      ]);

      expect(targetCards).toHaveLength(1);
      expect(invalidNumbers).toEqual([99, 100]);
    });

    it('should handle NaN values', () => {
      const { targetCards, invalidNumbers } = resolveCardNumbers(mockCards, [
        '1',
        'abc',
        '2',
      ]);

      expect(targetCards).toHaveLength(2);
      expect(invalidNumbers).toHaveLength(1);
      expect(Number.isNaN(invalidNumbers[0])).toBe(true);
    });

    it('should return empty arrays for empty input', () => {
      const { targetCards, invalidNumbers } = resolveCardNumbers(mockCards, []);

      expect(targetCards).toHaveLength(0);
      expect(invalidNumbers).toHaveLength(0);
    });

    it('should preserve order of input', () => {
      const { targetCards } = resolveCardNumbers(mockCards, ['3', '1', '2']);

      expect(targetCards[0].displayNumber).toBe(3);
      expect(targetCards[1].displayNumber).toBe(1);
      expect(targetCards[2].displayNumber).toBe(2);
    });
  });
});
