import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  validateGitHubToken,
  requestDeviceCode,
  pollForAccessToken,
  GITHUB_CLIENT_ID,
} from '../../../src/core/auth/github.js';

vi.mock('axios');
const mockAxios = vi.mocked(axios);

describe('GitHub Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateGitHubToken', () => {
    it('returns true for classic PAT format (ghp_)', () => {
      expect(validateGitHubToken('ghp_abcdefABCDEF123456789012345678901234')).toBe(true);
    });

    it('returns true for fine-grained PAT format (github_pat_)', () => {
      expect(validateGitHubToken('github_pat_12345678901234567890AB_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(validateGitHubToken('')).toBe(false);
    });

    it('returns false for token without valid prefix', () => {
      expect(validateGitHubToken('abc123456789')).toBe(false);
    });

    it('returns false for token too short', () => {
      expect(validateGitHubToken('ghp_short')).toBe(false);
    });

    it('returns true for OAuth tokens (gho_)', () => {
      expect(validateGitHubToken('gho_abcdefABCDEF123456789012345678901234')).toBe(true);
    });

    it('returns true for long enough alphanumeric tokens', () => {
      expect(validateGitHubToken('a'.repeat(40))).toBe(true);
    });
  });

  describe('GITHUB_CLIENT_ID', () => {
    it('is defined and non-empty', () => {
      expect(GITHUB_CLIENT_ID).toBeDefined();
      expect(GITHUB_CLIENT_ID.length).toBeGreaterThan(0);
    });
  });

  describe('requestDeviceCode', () => {
    it('requests device code with correct parameters', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          device_code: 'device123',
          user_code: 'ABCD-1234',
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 5,
        },
      });

      const result = await requestDeviceCode('test_client_id');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://github.com/login/device/code',
        {
          client_id: 'test_client_id',
          scope: 'repo',
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.device_code).toBe('device123');
      expect(result.user_code).toBe('ABCD-1234');
      expect(result.verification_uri).toBe('https://github.com/login/device');
    });

    it('throws on network error', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(requestDeviceCode('test_client_id')).rejects.toThrow('Network error');
    });
  });

  describe('pollForAccessToken', () => {
    it('returns token on successful authorization', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'gho_abc123',
          token_type: 'bearer',
          scope: 'repo',
        },
      });

      const onPoll = vi.fn();
      const resultPromise = pollForAccessToken('test_client', 'device123', 5, 900, onPoll);

      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(result).toBe('gho_abc123');
      expect(onPoll).toHaveBeenCalled();
    });

    it('continues polling on authorization_pending', async () => {
      mockAxios.post
        .mockResolvedValueOnce({
          data: { error: 'authorization_pending' },
        })
        .mockResolvedValueOnce({
          data: { error: 'authorization_pending' },
        })
        .mockResolvedValueOnce({
          data: {
            access_token: 'gho_success',
            token_type: 'bearer',
          },
        });

      const onPoll = vi.fn();
      const resultPromise = pollForAccessToken('test_client', 'device123', 1, 900, onPoll);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toBe('gho_success');
      expect(mockAxios.post).toHaveBeenCalledTimes(3);
    });

    it('increases interval on slow_down response', async () => {
      mockAxios.post
        .mockResolvedValueOnce({
          data: { error: 'slow_down' },
        })
        .mockResolvedValueOnce({
          data: {
            access_token: 'gho_after_slowdown',
            token_type: 'bearer',
          },
        });

      const onPoll = vi.fn();
      const resultPromise = pollForAccessToken('test_client', 'device123', 5, 900, onPoll);

      await vi.advanceTimersByTimeAsync(5000);
      await vi.advanceTimersByTimeAsync(10000);

      const result = await resultPromise;

      expect(result).toBe('gho_after_slowdown');
    });

    it('throws on access_denied', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { error: 'access_denied' },
      });

      const onPoll = vi.fn();
      const resultPromise = pollForAccessToken('test_client', 'device123', 1, 900, onPoll);

      // Attach catch handler before advancing time to prevent unhandled rejection
      const catchPromise = resultPromise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(1000);

      const error = await catchPromise;
      expect(error.message).toMatch(/denied/i);
    });

    it('throws on expired_token', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { error: 'expired_token' },
      });

      const onPoll = vi.fn();
      const resultPromise = pollForAccessToken('test_client', 'device123', 1, 900, onPoll);

      // Attach catch handler before advancing time to prevent unhandled rejection
      const catchPromise = resultPromise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(1000);

      const error = await catchPromise;
      expect(error.message).toMatch(/expired/i);
    });
  });
});
