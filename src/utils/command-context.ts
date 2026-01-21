import { loadCache } from './load-cache.js';
import { createTrelloClient } from './create-client.js';
import { getNumberedCards, type NumberedCard } from './display.js';
import { TrelloError, TrelloValidationError } from './errors.js';
import { t } from './i18n.js';
import type { Cache } from '../core/cache.js';
import type { TrelloClient } from '../api/trello-client.js';
import type { Card, List } from '../api/types.js';

/**
 * Base context for commands that need board access
 */
export interface BoardContext {
  cache: Cache;
  client: TrelloClient;
  boardId: string;
  lists: List[];
}

/**
 * Extended context for commands that work with cards
 */
export interface CardContext extends BoardContext {
  allCards: Card[];
  numberedCards: NumberedCard[];
  memberId: string | undefined;
  isFiltered: boolean;
}

/**
 * Options for card context loading
 */
export interface CardContextOptions {
  /** If true, show all cards regardless of member filter */
  all?: boolean;
  /** If true, include archived cards */
  includeArchived?: boolean;
}

/**
 * Loads board context (cache, client, boardId, lists)
 * Use for commands that need board-level access but not card operations
 */
export async function withBoardContext<T>(
  fn: (ctx: BoardContext) => Promise<T>
): Promise<T> {
  const cache = await loadCache();
  const boardId = cache.getBoardId();

  if (!boardId) {
    throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
  }

  const client = await createTrelloClient();
  const lists = cache.getAllLists();

  return fn({ cache, client, boardId, lists });
}

/**
 * Loads full card context including numbered cards
 * Use for commands that operate on cards (list, move, delete, etc.)
 */
export async function withCardContext<T>(
  options: CardContextOptions,
  fn: (ctx: CardContext) => Promise<T>
): Promise<T> {
  return withBoardContext(async ({ cache, client, boardId, lists }) => {
    const allCards = await client.cards.listByBoard(boardId);
    const currentMemberId = cache.getCurrentMemberId();
    const memberId = options.all ? undefined : currentMemberId;
    const isFiltered = !options.all && !!currentMemberId;
    const numberedCards = getNumberedCards(allCards, lists, { memberId });

    return fn({
      cache,
      client,
      boardId,
      lists,
      allCards,
      numberedCards,
      memberId,
      isFiltered,
    });
  });
}

/**
 * Finds a card by display number with proper error handling
 * @throws TrelloValidationError if card not found or no cards available
 */
export function findCardByNumber(
  numberedCards: NumberedCard[],
  cardNumber: number,
  memberId: string | undefined,
  errorKey: string = 'errors.invalidCard'
): NumberedCard {
  if (numberedCards.length === 0) {
    const message = memberId
      ? t('display.noCardsAvailableAssigned')
      : t('display.noCardsAvailable');
    throw new TrelloValidationError(message, 'cardNumber');
  }

  const card = numberedCards.find((c) => c.displayNumber === cardNumber);
  if (!card) {
    throw new TrelloValidationError(
      t(errorKey, { max: numberedCards.length }),
      'cardNumber'
    );
  }

  return card;
}

/**
 * Validates that cards are available, throws if empty
 */
export function requireCards(
  numberedCards: NumberedCard[],
  memberId: string | undefined
): void {
  if (numberedCards.length === 0) {
    const message = memberId
      ? t('display.noCardsAvailableAssigned')
      : t('display.noCardsAvailable');
    throw new TrelloValidationError(message, 'cards');
  }
}

/**
 * Resolves multiple card numbers to cards
 * Returns valid cards and invalid numbers separately
 */
export function resolveCardNumbers(
  numberedCards: NumberedCard[],
  cardNumbers: string[]
): { targetCards: NumberedCard[]; invalidNumbers: number[] } {
  const cardNums = cardNumbers.map((n) => parseInt(n, 10));
  const cardMap = new Map(numberedCards.map((c) => [c.displayNumber, c]));

  const invalidNumbers = cardNums.filter((n) => !cardMap.has(n) || isNaN(n));
  const targetCards = cardNums
    .map((n) => cardMap.get(n))
    .filter((c): c is NumberedCard => c !== undefined);

  return { targetCards, invalidNumbers };
}
