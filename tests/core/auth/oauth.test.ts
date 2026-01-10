import { describe, it, expect } from 'vitest';
import {
  generateAuthorizationUrl,
  validateToken,
  validateApiKey,
} from '../../../src/core/auth/oauth.js';
import {
  TRELLO_AUTH_BASE_URL,
  DEFAULT_OAUTH_CONFIG,
  TOKEN_REGEX,
} from '../../../src/core/auth/constants.js';

describe('OAuth', () => {
  describe('generateAuthorizationUrl', () => {
    it('generates valid Trello auth URL', () => {
      const apiKey = 'abc123def456abc123def456abc12345';
      const url = generateAuthorizationUrl(apiKey);

      expect(url).toContain(TRELLO_AUTH_BASE_URL);
      expect(url).toContain(`key=${apiKey}`);
    });

    it('includes all required parameters', () => {
      const apiKey = 'abc123def456abc123def456abc12345';
      const url = generateAuthorizationUrl(apiKey);

      expect(url).toContain('key=');
      expect(url).toContain('name=');
      expect(url).toContain('scope=');
      expect(url).toContain('expiration=');
      expect(url).toContain('response_type=token');
    });

    it('uses default config values', () => {
      const apiKey = 'abc123def456abc123def456abc12345';
      const url = generateAuthorizationUrl(apiKey);

      expect(url).toContain('name=Trello+CLI');
      expect(url).toContain(`scope=${encodeURIComponent(DEFAULT_OAUTH_CONFIG.scope)}`);
      expect(url).toContain(`expiration=${DEFAULT_OAUTH_CONFIG.expiration}`);
    });

    it('allows custom config values', () => {
      const apiKey = 'abc123def456abc123def456abc12345';
      const url = generateAuthorizationUrl(apiKey, {
        appName: 'My Custom App',
        scope: 'read',
        expiration: '1day',
      });

      expect(url).toContain('name=My+Custom+App');
      expect(url).toContain('scope=read');
      expect(url).toContain('expiration=1day');
    });

    it('URL-encodes app name', () => {
      const apiKey = 'abc123def456abc123def456abc12345';
      const url = generateAuthorizationUrl(apiKey, {
        appName: 'My App & Stuff',
      });

      expect(url).toContain('name=My+App+%26+Stuff');
    });
  });

  describe('validateToken', () => {
    it('accepts valid 64-char hex token (old format)', () => {
      const validToken = 'a'.repeat(64);
      expect(validateToken(validToken)).toBe(true);

      const mixedCaseToken = 'aAbBcCdDeEfF'.repeat(5) + 'aaaa';
      expect(validateToken(mixedCaseToken)).toBe(true);
    });

    it('accepts valid ATTA token (new format)', () => {
      const attaToken = 'ATTA' + 'a1b2c3d4e5f6'.repeat(6) + 'ab';
      expect(validateToken(attaToken)).toBe(true);

      const realFormatToken = 'ATTAe1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
      expect(validateToken(realFormatToken)).toBe(true);
    });

    it('rejects short tokens', () => {
      expect(validateToken('abc123')).toBe(false);
      expect(validateToken('a'.repeat(63))).toBe(false);
      expect(validateToken('ATTA' + 'a'.repeat(50))).toBe(false);
    });

    it('rejects invalid ATTA tokens (too short)', () => {
      expect(validateToken('ATTA')).toBe(false);
      expect(validateToken('ATTA123')).toBe(false);
      expect(validateToken('ATTA' + 'a'.repeat(59))).toBe(false);
    });

    it('rejects non-hex characters in old format', () => {
      const invalidToken = 'g'.repeat(64);
      expect(validateToken(invalidToken)).toBe(false);

      const partiallyInvalid = 'a'.repeat(63) + 'z';
      expect(validateToken(partiallyInvalid)).toBe(false);
    });

    it('trims whitespace before validation', () => {
      const tokenWithSpaces = '  ' + 'a'.repeat(64) + '  ';
      expect(validateToken(tokenWithSpaces)).toBe(true);

      const attaWithSpaces = '  ATTA' + 'a'.repeat(72) + '  ';
      expect(validateToken(attaWithSpaces)).toBe(true);
    });

    it('rejects empty string', () => {
      expect(validateToken('')).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    it('accepts valid API key with 32+ characters', () => {
      expect(validateApiKey('a'.repeat(32))).toBe(true);
      expect(validateApiKey('a'.repeat(64))).toBe(true);
    });

    it('rejects short API keys', () => {
      expect(validateApiKey('abc123')).toBe(false);
      expect(validateApiKey('a'.repeat(31))).toBe(false);
    });

    it('trims whitespace before validation', () => {
      const keyWithSpaces = '  ' + 'a'.repeat(32) + '  ';
      expect(validateApiKey(keyWithSpaces)).toBe(true);
    });
  });

  describe('TOKEN_REGEX', () => {
    it('matches valid hex tokens (old format)', () => {
      expect(TOKEN_REGEX.test('0123456789abcdef'.repeat(4))).toBe(true);
      expect(TOKEN_REGEX.test('ABCDEF0123456789'.repeat(4))).toBe(true);
    });

    it('matches valid ATTA tokens (new format, 76+ chars)', () => {
      expect(TOKEN_REGEX.test('ATTA' + 'a'.repeat(72))).toBe(true);
      expect(TOKEN_REGEX.test('ATTA' + 'a'.repeat(60))).toBe(true);
      expect(TOKEN_REGEX.test('ATTAe1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678')).toBe(true);
    });

    it('rejects invalid tokens', () => {
      expect(TOKEN_REGEX.test('invalid')).toBe(false);
      expect(TOKEN_REGEX.test('')).toBe(false);
      expect(TOKEN_REGEX.test('ATTA123')).toBe(false);
    });
  });
});
