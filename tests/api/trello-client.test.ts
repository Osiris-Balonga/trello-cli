import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { TrelloClient } from '../../src/api/trello-client.js';
import {
  TrelloAuthError,
  TrelloRateLimitError,
  TrelloNetworkError,
  TrelloAPIError,
} from '../../src/utils/errors.js';

vi.mock('axios');

const mockAxiosCreate = vi.mocked(axios.create);

describe('TrelloClient', () => {
  let mockApi: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
  };
  let requestInterceptor: (config: unknown) => Promise<unknown>;
  let responseErrorInterceptor: (error: unknown) => never;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    mockAxiosCreate.mockReturnValue(mockApi as unknown as ReturnType<typeof axios.create>);

    mockApi.interceptors.request.use.mockImplementation((successHandler) => {
      requestInterceptor = successHandler;
    });

    mockApi.interceptors.response.use.mockImplementation((_, errorHandler) => {
      responseErrorInterceptor = errorHandler;
    });
  });

  describe('constructor', () => {
    it('creates axios instance with correct config', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key123', token: 'token123' },
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.trello.com/1',
          timeout: 10000,
        })
      );
    });

    it('uses custom baseURL when provided', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
        baseURL: 'https://custom.api.com',
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api.com',
        })
      );
    });

    it('uses custom timeout when provided', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
        timeout: 30000,
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });
  });

  describe('request interceptor', () => {
    it('adds API key params for apikey auth', async () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'mykey', token: 'mytoken' },
      });

      const config = { params: { filter: 'open' } };
      const result = await requestInterceptor(config);

      expect(result).toEqual(
        expect.objectContaining({
          params: {
            filter: 'open',
            key: 'mykey',
            token: 'mytoken',
          },
        })
      );
    });

    it('adds key and token params for oauth auth (Manual PIN flow)', async () => {
      new TrelloClient({
        auth: { type: 'oauth', token: 'oauth_token', orgApiKey: 'org_api_key' },
      });

      const config = { params: { filter: 'open' } };
      const result = await requestInterceptor(config);

      expect(result).toEqual(
        expect.objectContaining({
          params: {
            filter: 'open',
            key: 'org_api_key',
            token: 'oauth_token',
          },
        })
      );
    });
  });

  describe('response error interceptor', () => {
    it('throws TrelloAuthError on 401', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        message: 'Request failed',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(TrelloAuthError);
    });

    it('throws TrelloRateLimitError on 429', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '30' },
          data: {},
        },
        message: 'Rate limit',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(TrelloRateLimitError);
    });

    it('throws TrelloNetworkError on timeout', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      const error = {
        code: 'ECONNABORTED',
        message: 'timeout',
      };

      try {
        responseErrorInterceptor(error);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TrelloNetworkError);
        expect((e as TrelloNetworkError).isTimeout).toBe(true);
      }
    });

    it('throws TrelloNetworkError on offline', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      const error = {
        code: 'ENOTFOUND',
        message: 'Network error',
      };

      try {
        responseErrorInterceptor(error);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(TrelloNetworkError);
        expect((e as TrelloNetworkError).isOffline).toBe(true);
      }
    });

    it('throws TrelloAPIError on other errors', () => {
      new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
        message: 'Request failed',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(TrelloAPIError);
    });
  });

  describe('resource accessors', () => {
    it('provides boards resource', () => {
      const client = new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      expect(client.boards).toBeDefined();
      expect(client.boards).toBe(client.boards);
    });

    it('provides cards resource', () => {
      const client = new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      expect(client.cards).toBeDefined();
      expect(client.cards).toBe(client.cards);
    });

    it('provides lists resource', () => {
      const client = new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      expect(client.lists).toBeDefined();
    });

    it('provides labels resource', () => {
      const client = new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      expect(client.labels).toBeDefined();
    });

    it('provides members resource', () => {
      const client = new TrelloClient({
        auth: { type: 'apikey', apiKey: 'key', token: 'token' },
      });

      expect(client.members).toBeDefined();
    });
  });
});
