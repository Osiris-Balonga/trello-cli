import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubMapper } from '../../../src/providers/github/mapper.js';
import type {
  GitHubRepository,
  GitHubIssue,
  GitHubUser,
  GitHubLabel,
  GitHubComment,
  ColumnConfig,
} from '../../../src/providers/github/types.js';

describe('GitHubMapper', () => {
  let mapper: GitHubMapper;

  const mockColumnConfigs: ColumnConfig[] = [
    { id: 'todo', name: 'To Do', labelName: 'status:todo', isClosedState: false },
    { id: 'doing', name: 'In Progress', labelName: 'status:doing', isClosedState: false },
    { id: 'done', name: 'Done', labelName: null, isClosedState: true },
  ];

  beforeEach(() => {
    mapper = new GitHubMapper();
    mapper.setColumnConfigs(mockColumnConfigs);
  });

  describe('toTask', () => {
    it('maps a basic open issue to a Task', () => {
      const issue: GitHubIssue = {
        number: 42,
        title: 'Fix login bug',
        body: 'Users cannot log in',
        state: 'open',
        labels: [],
        assignees: [],
        user: { id: 1, login: 'author', avatar_url: '', type: 'User' },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/42',
        comments: 5,
      };

      const task = mapper.toTask(issue);

      expect(task.id).toBe('42');
      expect(task.title).toBe('Fix login bug');
      expect(task.description).toBe('Users cannot log in');
      expect(task.url).toBe('https://github.com/owner/repo/issues/42');
      expect(task.archived).toBe(false);
    });

    it('maps a closed issue to Done column', () => {
      const issue: GitHubIssue = {
        number: 43,
        title: 'Completed task',
        body: null,
        state: 'closed',
        labels: [],
        assignees: [],
        user: { id: 1, login: 'author', avatar_url: '', type: 'User' },
        created_at: '2025-01-10T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        closed_at: '2025-01-15T12:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/43',
        comments: 0,
      };

      const task = mapper.toTask(issue);

      expect(task.archived).toBe(true);
      expect(task.columnId).toBe('done');
    });

    it('maps issue with status label to corresponding column', () => {
      const issue: GitHubIssue = {
        number: 44,
        title: 'In progress task',
        body: 'Working on it',
        state: 'open',
        labels: [
          { id: 1, name: 'status:doing', color: 'yellow' },
          { id: 2, name: 'bug', color: 'red' },
        ],
        assignees: [],
        user: { id: 1, login: 'author', avatar_url: '', type: 'User' },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/44',
        comments: 0,
      };

      const task = mapper.toTask(issue);

      expect(task.columnId).toBe('doing');
    });

    it('maps issue with assignees', () => {
      const issue: GitHubIssue = {
        number: 45,
        title: 'Assigned task',
        body: null,
        state: 'open',
        labels: [],
        assignees: [
          { id: 10, login: 'developer1', avatar_url: 'https://avatar.com/1', type: 'User' },
          { id: 20, login: 'developer2', avatar_url: 'https://avatar.com/2', type: 'User' },
        ],
        user: { id: 1, login: 'author', avatar_url: '', type: 'User' },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/45',
        comments: 0,
      };

      const task = mapper.toTask(issue);

      expect(task.assigneeIds).toEqual(['10', '20']);
    });

    it('maps issue with labels (excluding status labels)', () => {
      const issue: GitHubIssue = {
        number: 46,
        title: 'Labeled task',
        body: null,
        state: 'open',
        labels: [
          { id: 1, name: 'status:todo', color: 'green' },
          { id: 2, name: 'bug', color: 'red' },
          { id: 3, name: 'priority:high', color: 'orange' },
        ],
        assignees: [],
        user: { id: 1, login: 'author', avatar_url: '', type: 'User' },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T12:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/46',
        comments: 0,
      };

      const task = mapper.toTask(issue);

      expect(task.labelIds).toEqual(['2', '3']);
    });
  });

  describe('toBoard', () => {
    it('maps a repository to a Board', () => {
      const repo: GitHubRepository = {
        id: 123,
        name: 'my-project',
        full_name: 'owner/my-project',
        description: 'A cool project',
        private: false,
        html_url: 'https://github.com/owner/my-project',
        owner: { id: 1, login: 'owner', avatar_url: '', type: 'User' },
        updated_at: '2025-01-15T12:00:00Z',
      };

      const board = mapper.toBoard(repo);

      expect(board.id).toBe('owner/my-project');
      expect(board.name).toBe('my-project');
      expect(board.description).toBe('A cool project');
      expect(board.url).toBe('https://github.com/owner/my-project');
    });

    it('handles null description', () => {
      const repo: GitHubRepository = {
        id: 123,
        name: 'my-project',
        full_name: 'owner/my-project',
        description: null,
        private: false,
        html_url: 'https://github.com/owner/my-project',
        owner: { id: 1, login: 'owner', avatar_url: '', type: 'User' },
        updated_at: '2025-01-15T12:00:00Z',
      };

      const board = mapper.toBoard(repo);

      expect(board.description).toBeNull();
    });
  });

  describe('toColumn', () => {
    it('maps a ColumnConfig to a Column', () => {
      const config: ColumnConfig = {
        id: 'doing',
        name: 'In Progress',
        labelName: 'status:doing',
        isClosedState: false,
      };

      const column = mapper.toColumn(config, 1);

      expect(column.id).toBe('doing');
      expect(column.name).toBe('In Progress');
      expect(column.position).toBe(1);
      expect(column.closed).toBe(false);
    });
  });

  describe('toMember', () => {
    it('maps a GitHub user to a Member', () => {
      const user: GitHubUser = {
        id: 42,
        login: 'developer',
        avatar_url: 'https://avatars.githubusercontent.com/u/42',
        type: 'User',
      };

      const member = mapper.toMember(user);

      expect(member.id).toBe('42');
      expect(member.username).toBe('developer');
      expect(member.displayName).toBe('developer');
      expect(member.avatarUrl).toBe('https://avatars.githubusercontent.com/u/42');
    });
  });

  describe('toLabel', () => {
    it('maps a GitHub label to a Label', () => {
      const label: GitHubLabel = {
        id: 100,
        name: 'bug',
        color: 'd73a4a',
      };

      const mapped = mapper.toLabel(label);

      expect(mapped.id).toBe('100');
      expect(mapped.name).toBe('bug');
      expect(mapped.color).toBe('#d73a4a');
    });
  });

  describe('toComment', () => {
    it('maps a GitHub comment to a Comment', () => {
      const comment: GitHubComment = {
        id: 500,
        body: 'This is a comment',
        user: { id: 1, login: 'commenter', avatar_url: '', type: 'User' },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:30:00Z',
      };

      const mapped = mapper.toComment(comment);

      expect(mapped.id).toBe('500');
      expect(mapped.text).toBe('This is a comment');
      expect(mapped.author.id).toBe('1');
      expect(mapped.createdAt).toEqual(new Date('2025-01-15T10:00:00Z'));
    });
  });

  describe('toCreateIssueParams', () => {
    it('maps CreateTaskParams to GitHub issue params', () => {
      const params = mapper.toCreateIssueParams({
        title: 'New feature',
        description: 'Feature description',
        labels: ['bug', 'priority:high'],
        assignees: ['user1', 'user2'],
      });

      expect(params.title).toBe('New feature');
      expect(params.body).toBe('Feature description');
      expect(params.labels).toEqual(['bug', 'priority:high']);
      expect(params.assignees).toEqual(['user1', 'user2']);
    });

    it('handles minimal params', () => {
      const params = mapper.toCreateIssueParams({
        title: 'Simple task',
      });

      expect(params.title).toBe('Simple task');
      expect(params.body).toBeUndefined();
    });
  });

  describe('toUpdateIssueParams', () => {
    it('maps UpdateTaskParams to GitHub issue params', () => {
      const params = mapper.toUpdateIssueParams({
        title: 'Updated title',
        description: 'Updated description',
        archived: true,
      });

      expect(params.title).toBe('Updated title');
      expect(params.body).toBe('Updated description');
      expect(params.state).toBe('closed');
    });

    it('handles partial updates', () => {
      const params = mapper.toUpdateIssueParams({
        title: 'Only title update',
      });

      expect(params.title).toBe('Only title update');
      expect(params.body).toBeUndefined();
      expect(params.state).toBeUndefined();
    });

    it('maps archived=false to open state', () => {
      const params = mapper.toUpdateIssueParams({
        archived: false,
      });

      expect(params.state).toBe('open');
    });
  });

  describe('isStatusLabel', () => {
    it('returns true for status prefix labels', () => {
      expect(mapper.isStatusLabel('status:todo')).toBe(true);
      expect(mapper.isStatusLabel('status:doing')).toBe(true);
    });

    it('returns false for regular labels', () => {
      expect(mapper.isStatusLabel('bug')).toBe(false);
      expect(mapper.isStatusLabel('feature')).toBe(false);
    });
  });

  describe('filterNonStatusLabels', () => {
    it('filters out status labels', () => {
      const labels: GitHubLabel[] = [
        { id: 1, name: 'status:todo', color: 'green' },
        { id: 2, name: 'bug', color: 'red' },
        { id: 3, name: 'status:doing', color: 'yellow' },
        { id: 4, name: 'feature', color: 'blue' },
      ];

      const filtered = mapper.filterNonStatusLabels(labels);

      expect(filtered.map((l) => l.name)).toEqual(['bug', 'feature']);
    });
  });
});
