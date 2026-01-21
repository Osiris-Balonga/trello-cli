import type { TaskProvider } from '../provider.js';
import type {
  Task,
  Board,
  Column,
  Member,
  Label,
  Comment,
  CreateTaskParams,
  UpdateTaskParams,
  TaskFilter,
} from '../../models/index.js';
import { GitHubClient } from './client.js';
import { GitHubMapper } from './mapper.js';
import type { GitHubAuthConfig, ColumnConfig } from './types.js';

export class GitHubProvider implements TaskProvider {
  readonly type = 'github' as const;
  readonly displayName = 'GitHub Issues';

  private client: GitHubClient | null = null;
  private mapper: GitHubMapper;
  private authConfig: GitHubAuthConfig | null = null;
  private currentRepo: { owner: string; repo: string } | null = null;
  private columnConfigs: ColumnConfig[] = [];

  constructor() {
    this.mapper = new GitHubMapper();
  }

  setAuth(auth: GitHubAuthConfig): void {
    this.authConfig = auth;
  }

  setRepo(owner: string, repo: string): void {
    this.currentRepo = { owner, repo };
  }

  setColumnConfigs(configs: ColumnConfig[]): void {
    this.columnConfigs = configs;
    this.mapper.setColumnConfigs(configs);
  }

  getColumnConfigs(): ColumnConfig[] {
    return this.columnConfigs;
  }

  async initialize(): Promise<void> {
    if (!this.authConfig) {
      throw new Error('Auth config not set. Call setAuth() first.');
    }
    this.client = new GitHubClient({ auth: this.authConfig });
  }

  async validateAuth(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.getMe();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentMember(): Promise<Member> {
    this.ensureClient();
    const user = await this.client!.getMe();
    return this.mapper.toMember(user);
  }

  async listBoards(): Promise<Board[]> {
    this.ensureClient();
    const repos = await this.client!.listUserRepos();
    return repos.map((r) => this.mapper.toBoard(r));
  }

  async listOrgBoards(org: string): Promise<Board[]> {
    this.ensureClient();
    const repos = await this.client!.listOrgRepos(org);
    return repos.map((r) => this.mapper.toBoard(r));
  }

  async getBoard(boardId: string): Promise<Board> {
    this.ensureClient();
    const [owner, repo] = this.parseRepoId(boardId);
    const repository = await this.client!.getRepo(owner, repo);
    return this.mapper.toBoard(repository);
  }

  async getBoardColumns(_boardId: string): Promise<Column[]> {
    return this.columnConfigs.map((config, index) =>
      this.mapper.toColumn(config, index)
    );
  }

  async listTasks(boardId: string, filter?: TaskFilter): Promise<Task[]> {
    this.ensureClient();
    const [owner, repo] = this.parseRepoId(boardId);

    const state = filter?.archived === true ? 'closed' : 'all';
    const issues = await this.client!.listIssues(owner, repo, state);

    let tasks = issues.map((issue) => {
      const column = this.findColumnForIssue(issue);
      return this.mapper.toTask(issue, column);
    });

    if (filter) {
      if (filter.columnId) {
        tasks = tasks.filter((t) => t.columnId === filter.columnId);
      }
      if (filter.columnName) {
        tasks = tasks.filter(
          (t) => t.columnName.toLowerCase() === filter.columnName!.toLowerCase()
        );
      }
      if (filter.assignee) {
        tasks = tasks.filter((t) => t.assigneeIds.includes(filter.assignee!));
      }
      if (filter.label) {
        tasks = tasks.filter((t) => t.labelIds.includes(filter.label!));
      }
      if (filter.archived !== undefined) {
        tasks = tasks.filter((t) => t.archived === filter.archived);
      }
    }

    return tasks;
  }

  async getTask(taskId: string): Promise<Task> {
    this.ensureClient();
    this.ensureRepo();
    const issueNumber = parseInt(taskId, 10);
    const issue = await this.client!.getIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );
    const column = this.findColumnForIssue(issue);
    return this.mapper.toTask(issue, column);
  }

  async createTask(
    boardId: string,
    columnId: string,
    params: CreateTaskParams
  ): Promise<Task> {
    this.ensureClient();
    const [owner, repo] = this.parseRepoId(boardId);

    const column = this.columnConfigs.find((c) => c.id === columnId);
    const issueParams = this.mapper.toCreateIssueParams(params, column);

    const issue = await this.client!.createIssue(owner, repo, issueParams);

    if (column?.isClosedState) {
      await this.client!.closeIssue(owner, repo, issue.number);
      const closedIssue = await this.client!.getIssue(owner, repo, issue.number);
      return this.mapper.toTask(closedIssue, column);
    }

    return this.mapper.toTask(issue, column);
  }

  async updateTask(taskId: string, params: UpdateTaskParams): Promise<Task> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const currentIssue = await this.client!.getIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );

    const currentLabels = currentIssue.labels.map((l) => l.name);
    const oldColumn = this.findColumnForIssue(currentIssue);
    const newColumn = params.columnId
      ? this.columnConfigs.find((c) => c.id === params.columnId)
      : undefined;

    const updateParams = this.mapper.toUpdateIssueParams(
      params,
      currentLabels,
      newColumn,
      oldColumn
    );

    const issue = await this.client!.updateIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      updateParams
    );

    const column = newColumn || this.findColumnForIssue(issue);
    return this.mapper.toTask(issue, column);
  }

  async deleteTask(taskId: string): Promise<void> {
    throw new Error(
      `GitHub Issues cannot be deleted via API. Issue #${taskId} can only be closed.`
    );
  }

  async moveTask(taskId: string, columnId: string): Promise<Task> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const column = this.columnConfigs.find((c) => c.id === columnId);

    if (!column) {
      throw new Error(`Column "${columnId}" not found in configuration.`);
    }

    const currentIssue = await this.client!.getIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );

    const currentLabels = currentIssue.labels.map((l) => l.name);

    const statusLabelsToRemove = this.columnConfigs
      .filter((c) => c.labelName)
      .map((c) => c.labelName!);
    const labelsWithoutStatus = currentLabels.filter(
      (l) => !statusLabelsToRemove.includes(l)
    );

    const newLabels = column.labelName
      ? [...labelsWithoutStatus, column.labelName]
      : labelsWithoutStatus;

    const newState = column.isClosedState ? 'closed' : 'open';
    const stateChanged = (currentIssue.state === 'closed') !== column.isClosedState;

    const updateParams: Parameters<GitHubClient['updateIssue']>[3] = {
      labels: newLabels,
    };

    if (stateChanged) {
      updateParams.state = newState;
    }

    const issue = await this.client!.updateIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      updateParams
    );

    return this.mapper.toTask(issue, column);
  }

  async archiveTask(taskId: string): Promise<Task> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const issue = await this.client!.closeIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );

    const column = this.columnConfigs.find((c) => c.isClosedState);
    return this.mapper.toTask(issue, column);
  }

  async unarchiveTask(taskId: string): Promise<Task> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const issue = await this.client!.reopenIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );

    const column = this.findColumnForIssue(issue);
    return this.mapper.toTask(issue, column);
  }

  async listComments(taskId: string): Promise<Comment[]> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const comments = await this.client!.listComments(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber
    );

    return comments.map((c) => this.mapper.toComment(c));
  }

  async addComment(taskId: string, text: string): Promise<Comment> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    const comment = await this.client!.createComment(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      text
    );

    return this.mapper.toComment(comment);
  }

  async listMembers(boardId: string): Promise<Member[]> {
    this.ensureClient();
    const [owner, repo] = this.parseRepoId(boardId);
    const collaborators = await this.client!.listCollaborators(owner, repo);
    return collaborators.map((c) => this.mapper.toMember(c));
  }

  async listLabels(boardId: string): Promise<Label[]> {
    this.ensureClient();
    const [owner, repo] = this.parseRepoId(boardId);
    const labels = await this.client!.listLabels(owner, repo);
    const nonStatusLabels = this.mapper.filterNonStatusLabels(labels);
    return nonStatusLabels.map((l) => this.mapper.toLabel(l));
  }

  async addLabel(taskId: string, labelId: string): Promise<void> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    await this.client!.addLabelsToIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      [labelId]
    );
  }

  async removeLabel(taskId: string, labelId: string): Promise<void> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    await this.client!.removeLabelFromIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      labelId
    );
  }

  async addMember(taskId: string, memberId: string): Promise<void> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    await this.client!.addAssigneesToIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      [memberId]
    );
  }

  async removeMember(taskId: string, memberId: string): Promise<void> {
    this.ensureClient();
    this.ensureRepo();

    const issueNumber = parseInt(taskId, 10);
    await this.client!.removeAssigneesFromIssue(
      this.currentRepo!.owner,
      this.currentRepo!.repo,
      issueNumber,
      [memberId]
    );
  }

  private parseRepoId(boardId: string): [string, string] {
    const parts = boardId.split('/');
    if (parts.length !== 2) {
      throw new Error(
        `Invalid board ID format: "${boardId}". Expected "owner/repo".`
      );
    }
    return [parts[0], parts[1]];
  }

  private findColumnForIssue(
    issue: Parameters<GitHubMapper['toTask']>[0]
  ): ColumnConfig | undefined {
    if (issue.state === 'closed') {
      return this.columnConfigs.find((c) => c.isClosedState);
    }

    for (const label of issue.labels) {
      const column = this.columnConfigs.find((c) => c.labelName === label.name);
      if (column) {
        return column;
      }
    }

    return this.columnConfigs.find((c) => !c.isClosedState && !c.labelName);
  }

  private ensureClient(): void {
    if (!this.client) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
  }

  private ensureRepo(): void {
    if (!this.currentRepo) {
      throw new Error(
        'Repository not set. Call setRepo() or use boardId in method.'
      );
    }
  }
}

export { GitHubClient } from './client.js';
export { GitHubMapper } from './mapper.js';
export * from './types.js';
