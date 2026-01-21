import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  GitHubAuthConfig,
  GitHubClientConfig,
  GitHubRepository,
  GitHubIssue,
  GitHubLabel,
  GitHubUser,
  GitHubComment,
  GitHubCollaborator,
  GitHubCreateIssueParams,
  GitHubUpdateIssueParams,
} from './types.js';
import {
  GitHubAPIError,
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNetworkError,
} from '../../utils/errors.js';
import { apiLimiter } from '../../utils/rate-limiter.js';

export class GitHubClient {
  private api: AxiosInstance;
  private auth: GitHubAuthConfig;

  constructor(config: GitHubClientConfig) {
    this.auth = config.auth;

    this.api = axios.create({
      baseURL: config.baseURL || 'https://api.github.com',
      timeout: config.timeout || 10000,
      headers: {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    this.api.interceptors.request.use(
      async (axiosConfig: InternalAxiosRequestConfig) => {
        await apiLimiter(() => Promise.resolve());

        axiosConfig.headers.Authorization = `Bearer ${this.auth.token}`;
        return axiosConfig;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        if (!error.response) {
          const isTimeout =
            error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
          const isOffline =
            error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH';
          throw new GitHubNetworkError(isTimeout, isOffline);
        }
        if (error.response.status === 401) {
          throw new GitHubAuthError();
        }
        if (error.response.status === 403) {
          const rateLimitRemaining = error.response.headers['x-ratelimit-remaining'];
          if (rateLimitRemaining === '0') {
            const resetTime = error.response.headers['x-ratelimit-reset'];
            const retryAfter = resetTime
              ? Math.ceil(Number(resetTime) - Date.now() / 1000)
              : undefined;
            throw new GitHubRateLimitError(retryAfter);
          }
        }
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new GitHubRateLimitError(
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        throw new GitHubAPIError(error);
      }
    );
  }

  async getMe(): Promise<GitHubUser> {
    const { data } = await this.api.get<GitHubUser>('/user');
    return data;
  }

  async listUserRepos(): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubRepository[]>('/user/repos', {
        params: {
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page,
        },
      });

      repos.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return repos;
  }

  async listOrgRepos(org: string): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubRepository[]>(`/orgs/${org}/repos`, {
        params: {
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page,
        },
      });

      repos.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return repos;
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepository> {
    const { data } = await this.api.get<GitHubRepository>(`/repos/${owner}/${repo}`);
    return data;
  }

  async listIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubIssue[]>(
        `/repos/${owner}/${repo}/issues`,
        {
          params: {
            state,
            filter: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page,
          },
        }
      );

      // Filter out pull requests (GitHub API returns PRs as issues)
      const onlyIssues = data.filter(
        (issue) => !('pull_request' in issue)
      );
      issues.push(...onlyIssues);

      if (data.length < perPage) break;
      page++;
    }

    return issues;
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const { data } = await this.api.get<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`
    );
    return data;
  }

  async createIssue(
    owner: string,
    repo: string,
    params: GitHubCreateIssueParams
  ): Promise<GitHubIssue> {
    const { data } = await this.api.post<GitHubIssue>(
      `/repos/${owner}/${repo}/issues`,
      params
    );
    return data;
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    params: GitHubUpdateIssueParams
  ): Promise<GitHubIssue> {
    const { data } = await this.api.patch<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      params
    );
    return data;
  }

  async closeIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(owner, repo, issueNumber, { state: 'closed' });
  }

  async reopenIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(owner, repo, issueNumber, { state: 'open' });
  }

  async listLabels(owner: string, repo: string): Promise<GitHubLabel[]> {
    const labels: GitHubLabel[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubLabel[]>(
        `/repos/${owner}/${repo}/labels`,
        {
          params: {
            per_page: perPage,
            page,
          },
        }
      );

      labels.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return labels;
  }

  async addLabelsToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
  ): Promise<GitHubLabel[]> {
    const { data } = await this.api.post<GitHubLabel[]>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
      { labels }
    );
    return data;
  }

  async removeLabelFromIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    labelName: string
  ): Promise<void> {
    await this.api.delete(
      `/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(labelName)}`
    );
  }

  async setLabelsOnIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
  ): Promise<GitHubLabel[]> {
    const { data } = await this.api.put<GitHubLabel[]>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
      { labels }
    );
    return data;
  }

  async listCollaborators(owner: string, repo: string): Promise<GitHubCollaborator[]> {
    const collaborators: GitHubCollaborator[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubCollaborator[]>(
        `/repos/${owner}/${repo}/collaborators`,
        {
          params: {
            per_page: perPage,
            page,
          },
        }
      );

      collaborators.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return collaborators;
  }

  async addAssigneesToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    assignees: string[]
  ): Promise<GitHubIssue> {
    const { data } = await this.api.post<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/assignees`,
      { assignees }
    );
    return data;
  }

  async removeAssigneesFromIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    assignees: string[]
  ): Promise<GitHubIssue> {
    const { data } = await this.api.delete<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/assignees`,
      { data: { assignees } }
    );
    return data;
  }

  async listComments(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<GitHubComment[]> {
    const comments: GitHubComment[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await this.api.get<GitHubComment[]>(
        `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        {
          params: {
            per_page: perPage,
            page,
          },
        }
      );

      comments.push(...data);

      if (data.length < perPage) break;
      page++;
    }

    return comments;
  }

  async createComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<GitHubComment> {
    const { data } = await this.api.post<GitHubComment>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { body }
    );
    return data;
  }
}
