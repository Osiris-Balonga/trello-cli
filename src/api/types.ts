// Backwards compatibility - re-exports from providers/trello
export type {
  TrelloBoard as Board,
  TrelloList as List,
  TrelloCard as Card,
  TrelloMember as Member,
  TrelloLabel as Label,
  TrelloAction,
  TrelloCreateCardParams as CreateCardParams,
  TrelloUpdateCardParams as UpdateCardParams,
  TrelloAuthConfig as AuthConfig,
  TrelloClientConfig as TrelloConfig,
} from '../providers/trello/types.js';
