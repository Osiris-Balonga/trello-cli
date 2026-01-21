import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GitHubClient } from '../../../src/providers/github/client.js';
import {
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNetworkError,
  GitHubAPIError,
} from '../../../src/utils/errors.js';

vi.mock('axios');
vi.mock('../../../src/utils/rate-limiter.js', () => ({
  apiLimiter: vi.fn((fn) => fn()),
}));

const mockAxiosCreate = vi.mocked(axios.create);

describe('GitHubClient', () => {
  let mockApi: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
  };
  let requestInterceptor: (config: { headers: Record<string, string> }) => Promise<{ headers: Record<string, string> }>;
  let responseErrorInterceptor: (error: unknown) => never;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
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
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token123' },
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.github.com',
          timeout: 10000,
        })
      );
    });

    it('uses custom baseURL when provided', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
        baseURL: 'https://custom.github.com',
      });

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.github.com',
        })
      );
    });

    it('uses custom timeout when provided', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
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
    it('adds Authorization header with Bearer token', async () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_mytoken' },
      });

      const config = { headers: {} as Record<string, string> };
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer ghp_mytoken');
    });
  });

  describe('response error interceptor', () => {
    it('throws GitHubAuthError on 401', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        response: {
          status: 401,
          data: { message: 'Bad credentials' },
        },
        message: 'Request failed',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(GitHubAuthError);
    });

    it('throws GitHubRateLimitError on 403 with rate limit', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        response: {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Date.now() / 1000 + 60) },
          data: { message: 'API rate limit exceeded' },
        },
        message: 'Rate limit',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(GitHubRateLimitError);
    });

    it('throws GitHubRateLimitError on 429', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
          data: {},
        },
        message: 'Too many requests',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(GitHubRateLimitError);
    });

    it('throws GitHubNetworkError on timeout', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        code: 'ECONNABORTED',
        message: 'timeout',
      };

      try {
        responseErrorInterceptor(error);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(GitHubNetworkError);
        expect((e as GitHubNetworkError).isTimeout).toBe(true);
      }
    });

    it('throws GitHubNetworkError on offline', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        code: 'ENOTFOUND',
        message: 'Network error',
      };

      try {
        responseErrorInterceptor(error);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(GitHubNetworkError);
        expect((e as GitHubNetworkError).isOffline).toBe(true);
      }
    });

    it('throws GitHubAPIError on other errors', () => {
      new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });

      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
        message: 'Request failed',
      };

      expect(() => responseErrorInterceptor(error)).toThrow(GitHubAPIError);
    });
  });

  describe('API methods', () => {
    it('getMe calls correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: { login: 'testuser' } });

      await client.getMe();

      expect(mockApi.get).toHaveBeenCalledWith('/user');
    });

    it('listUserRepos calls correct endpoint with params', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await client.listUserRepos();

      expect(mockApi.get).toHaveBeenCalledWith('/user/repos', {
        params: {
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page: 1,
        },
      });
    });

    it('listOrgRepos calls correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await client.listOrgRepos('myorg');

      expect(mockApi.get).toHaveBeenCalledWith('/orgs/myorg/repos', {
        params: {
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page: 1,
        },
      });
    });

    it('listIssues calls correct endpoint with state filter', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await client.listIssues('owner', 'repo', 'open');

      expect(mockApi.get).toHaveBeenCalledWith('/repos/owner/repo/issues', {
        params: {
          state: 'open',
          filter: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page: 1,
        },
      });
    });

    it('createIssue posts to correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.post.mockResolvedValueOnce({
        data: { number: 1, title: 'Test' },
      });

      await client.createIssue('owner', 'repo', {
        title: 'Test Issue',
        body: 'Description',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/repos/owner/repo/issues', {
        title: 'Test Issue',
        body: 'Description',
      });
    });

    it('updateIssue patches correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.patch.mockResolvedValueOnce({
        data: { number: 1, title: 'Updated' },
      });

      await client.updateIssue('owner', 'repo', 1, {
        title: 'Updated Title',
      });

      expect(mockApi.patch).toHaveBeenCalledWith('/repos/owner/repo/issues/1', {
        title: 'Updated Title',
      });
    });

    it('listLabels calls correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await client.listLabels('owner', 'repo');

      expect(mockApi.get).toHaveBeenCalledWith('/repos/owner/repo/labels', {
        params: { per_page: 100, page: 1 },
      });
    });

    it('listCollaborators calls correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.get.mockResolvedValueOnce({ data: [] });

      await client.listCollaborators('owner', 'repo');

      expect(mockApi.get).toHaveBeenCalledWith('/repos/owner/repo/collaborators', {
        params: { per_page: 100, page: 1 },
      });
    });

    it('createComment posts to correct endpoint', async () => {
      const client = new GitHubClient({
        auth: { type: 'pat', token: 'ghp_token' },
      });
      mockApi.post.mockResolvedValueOnce({
        data: { id: 1, body: 'Comment' },
      });

      await client.createComment('owner', 'repo', 1, 'My comment');

      expect(mockApi.post).toHaveBeenCalledWith('/repos/owner/repo/issues/1/comments', {
        body: 'My comment',
      });
    });
  });
});
