export const TRELLO_AUTH_BASE_URL = 'https://trello.com/1/authorize';

export const DEFAULT_APP_NAME = 'Trello CLI';

export type OAuthScope = 'read' | 'read,write' | 'read,write,account';
export type OAuthExpiration = 'never' | '1hour' | '1day' | '30days';

export const DEFAULT_OAUTH_CONFIG = {
  appName: DEFAULT_APP_NAME,
  scope: 'read,write' as OAuthScope,
  expiration: 'never' as OAuthExpiration,
} as const;

export const TOKEN_REGEX = /^[a-f0-9]{64}$/i;
