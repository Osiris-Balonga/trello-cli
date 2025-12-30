import {
  TRELLO_AUTH_BASE_URL,
  DEFAULT_OAUTH_CONFIG,
  TOKEN_REGEX,
  type OAuthScope,
  type OAuthExpiration,
} from './constants.js';

export interface OAuthConfig {
  appName: string;
  scope: OAuthScope;
  expiration: OAuthExpiration;
}

export function generateAuthorizationUrl(
  apiKey: string,
  config: Partial<OAuthConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_OAUTH_CONFIG, ...config };

  const params = new URLSearchParams({
    key: apiKey,
    name: finalConfig.appName,
    scope: finalConfig.scope,
    expiration: finalConfig.expiration,
    response_type: 'token',
  });

  return `${TRELLO_AUTH_BASE_URL}?${params.toString()}`;
}

export function validateToken(token: string): boolean {
  return TOKEN_REGEX.test(token.trim());
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.trim().length >= 32;
}
