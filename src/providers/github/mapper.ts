import type {
  Task,
  TaskStatus,
  Board,
  Column,
  Member,
  Label,
  Comment,
  CreateTaskParams,
  UpdateTaskParams,
} from '../../models/index.js';
import type {
  GitHubRepository,
  GitHubIssue,
  GitHubLabel,
  GitHubUser,
  GitHubComment,
  GitHubCollaborator,
  GitHubCreateIssueParams,
  GitHubUpdateIssueParams,
  ColumnConfig,
} from './types.js';

export class GitHubMapper {
  private columnConfigs: ColumnConfig[] = [];
  private statusLabelPrefix = 'status:';

  setColumnConfigs(configs: ColumnConfig[]): void {
    this.columnConfigs = configs;
  }

  setStatusLabelPrefix(prefix: string): void {
    this.statusLabelPrefix = prefix;
  }

  getStatusLabelPrefix(): string {
    return this.statusLabelPrefix;
  }

  toTask(issue: GitHubIssue, columnConfig?: ColumnConfig): Task {
    const column = columnConfig || this.inferColumn(issue);

    return {
      id: String(issue.number),
      number: issue.number,
      title: issue.title,
      description: issue.body,
      status: this.inferStatus(issue, column),
      columnId: column?.id || 'open',
      columnName: column?.name || (issue.state === 'open' ? 'Open' : 'Closed'),
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      dueDate: null,
      dueComplete: issue.state === 'closed',
      assigneeIds: issue.assignees.map((a) => String(a.id)),
      labelIds: issue.labels
        .filter((l) => !this.isStatusLabel(l.name))
        .map((l) => String(l.id)),
      url: issue.html_url,
      archived: issue.state === 'closed',
      _raw: issue,
    };
  }

  toBoard(repo: GitHubRepository): Board {
    return {
      id: repo.full_name,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      closed: false,
      _raw: repo,
    };
  }

  toColumn(config: ColumnConfig, position: number): Column {
    return {
      id: config.id,
      name: config.name,
      position,
      closed: false,
      _raw: config,
    };
  }

  toMember(user: GitHubUser | GitHubCollaborator): Member {
    return {
      id: String(user.id),
      username: user.login,
      displayName: user.login,
      avatarUrl: user.avatar_url,
      fullName: user.login,
      _raw: user,
    };
  }

  toLabel(label: GitHubLabel): Label {
    return {
      id: String(label.id),
      name: label.name,
      color: `#${label.color}`,
      _raw: label,
    };
  }

  toComment(comment: GitHubComment): Comment {
    return {
      id: String(comment.id),
      text: comment.body,
      author: {
        id: String(comment.user?.id || 0),
        username: comment.user?.login || 'unknown',
        displayName: comment.user?.login || 'Unknown',
        avatarUrl: comment.user?.avatar_url || null,
        _raw: comment.user,
      },
      createdAt: new Date(comment.created_at),
      _raw: comment,
    };
  }

  toCreateIssueParams(
    params: CreateTaskParams,
    columnConfig?: ColumnConfig
  ): GitHubCreateIssueParams {
    const labels: string[] = [];

    if (params.labels) {
      labels.push(...params.labels);
    }

    if (columnConfig?.labelName) {
      labels.push(columnConfig.labelName);
    }

    return {
      title: params.title,
      body: params.description,
      labels: labels.length > 0 ? labels : undefined,
      assignees: params.assignees,
    };
  }

  toUpdateIssueParams(
    params: UpdateTaskParams,
    currentLabels: string[] = [],
    newColumnConfig?: ColumnConfig,
    oldColumnConfig?: ColumnConfig
  ): GitHubUpdateIssueParams {
    const result: GitHubUpdateIssueParams = {};

    if (params.title !== undefined) {
      result.title = params.title;
    }

    if (params.description !== undefined) {
      result.body = params.description ?? undefined;
    }

    if (params.archived !== undefined) {
      result.state = params.archived ? 'closed' : 'open';
    }

    if (params.assignees !== undefined) {
      result.assignees = params.assignees;
    }

    if (params.labels !== undefined || newColumnConfig) {
      let labels = params.labels ? [...params.labels] : [...currentLabels];

      if (oldColumnConfig?.labelName) {
        labels = labels.filter((l) => l !== oldColumnConfig.labelName);
      }

      if (newColumnConfig?.labelName) {
        if (!labels.includes(newColumnConfig.labelName)) {
          labels.push(newColumnConfig.labelName);
        }
      }

      result.labels = labels;
    }

    return result;
  }

  isStatusLabel(labelName: string): boolean {
    return (
      labelName.startsWith(this.statusLabelPrefix) ||
      this.columnConfigs.some((c) => c.labelName === labelName)
    );
  }

  filterNonStatusLabels(labels: GitHubLabel[]): GitHubLabel[] {
    return labels.filter((l) => !this.isStatusLabel(l.name));
  }

  private inferColumn(issue: GitHubIssue): ColumnConfig | undefined {
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

  private inferStatus(issue: GitHubIssue, column?: ColumnConfig): TaskStatus {
    if (issue.state === 'closed') {
      return 'done';
    }

    if (column) {
      if (column.isClosedState) return 'done';
      if (column.name.toLowerCase().includes('progress') ||
          column.name.toLowerCase().includes('doing')) {
        return 'in_progress';
      }
    }

    return 'open';
  }
}
