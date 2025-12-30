import { describe, it, expect } from 'vitest';
import {
  parseBranchName,
  formatBranchAsCardTitle,
  type BranchInfo,
} from '../../src/core/git.js';

describe('parseBranchName', () => {
  describe('branch type detection', () => {
    it('detects feature branch', () => {
      const info = parseBranchName('feature/add-login');
      expect(info.isFeature).toBe(true);
      expect(info.isBugfix).toBe(false);
      expect(info.isHotfix).toBe(false);
    });

    it('detects bugfix branch', () => {
      const info = parseBranchName('bugfix/fix-typo');
      expect(info.isBugfix).toBe(true);
      expect(info.isFeature).toBe(false);
    });

    it('detects fix branch as bugfix', () => {
      const info = parseBranchName('fix/login-error');
      expect(info.isBugfix).toBe(true);
    });

    it('detects hotfix branch', () => {
      const info = parseBranchName('hotfix/critical-bug');
      expect(info.isHotfix).toBe(true);
    });

    it('handles hyphen separator', () => {
      const info = parseBranchName('feature-add-login');
      expect(info.isFeature).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(parseBranchName('FEATURE/test').isFeature).toBe(true);
      expect(parseBranchName('Feature/test').isFeature).toBe(true);
      expect(parseBranchName('BUGFIX/test').isBugfix).toBe(true);
    });
  });

  describe('ticket ID extraction', () => {
    it('extracts JIRA-style ticket ID', () => {
      const info = parseBranchName('feature/PROJ-123-add-login');
      expect(info.ticketId).toBe('PROJ-123');
    });

    it('extracts ticket ID without prefix', () => {
      const info = parseBranchName('ABC-456-fix-bug');
      expect(info.ticketId).toBe('ABC-456');
    });

    it('extracts ticket ID with slash separator', () => {
      const info = parseBranchName('feature/JIRA-789/implement-feature');
      expect(info.ticketId).toBe('JIRA-789');
    });

    it('returns undefined when no ticket ID', () => {
      const info = parseBranchName('feature/add-login');
      expect(info.ticketId).toBeUndefined();
    });
  });

  describe('description extraction', () => {
    it('extracts description from simple branch', () => {
      const info = parseBranchName('add-user-auth');
      expect(info.description).toBe('Add user auth');
    });

    it('extracts description after prefix', () => {
      const info = parseBranchName('feature/implement-oauth');
      expect(info.description).toBe('Implement oauth');
    });

    it('extracts description after ticket ID', () => {
      const info = parseBranchName('feature/PROJ-123-add-login');
      expect(info.description).toBe('Add login');
    });

    it('replaces underscores with spaces', () => {
      const info = parseBranchName('feature/add_user_authentication');
      expect(info.description).toBe('Add user authentication');
    });

    it('capitalizes first letter', () => {
      const info = parseBranchName('lowercase-branch');
      expect(info.description?.charAt(0)).toBe('L');
    });

    it('handles consecutive separators', () => {
      const info = parseBranchName('feature--multiple---dashes');
      expect(info.description).not.toContain('  ');
    });
  });

  describe('edge cases', () => {
    it('handles empty branch name', () => {
      const info = parseBranchName('');
      expect(info.name).toBe('');
    });

    it('trims whitespace', () => {
      const info = parseBranchName('  feature/test  ');
      expect(info.name).toBe('feature/test');
    });

    it('preserves original name', () => {
      const info = parseBranchName('Feature/TEST-123-My_Branch');
      expect(info.name).toBe('Feature/TEST-123-My_Branch');
    });
  });
});

describe('formatBranchAsCardTitle', () => {
  it('formats feature branch without prefix', () => {
    const info: BranchInfo = {
      name: 'feature/add-login',
      isFeature: true,
      isBugfix: false,
      isHotfix: false,
      description: 'Add login',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('Add login');
  });

  it('adds [Bug] prefix for bugfix', () => {
    const info: BranchInfo = {
      name: 'bugfix/fix-crash',
      isFeature: false,
      isBugfix: true,
      isHotfix: false,
      description: 'Fix crash',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('[Bug] Fix crash');
  });

  it('adds [Hotfix] prefix for hotfix', () => {
    const info: BranchInfo = {
      name: 'hotfix/urgent',
      isFeature: false,
      isBugfix: false,
      isHotfix: true,
      description: 'Urgent',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('[Hotfix] Urgent');
  });

  it('includes ticket ID', () => {
    const info: BranchInfo = {
      name: 'feature/PROJ-123-add-login',
      isFeature: true,
      isBugfix: false,
      isHotfix: false,
      ticketId: 'PROJ-123',
      description: 'Add login',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('[PROJ-123] Add login');
  });

  it('combines bug prefix with ticket ID', () => {
    const info: BranchInfo = {
      name: 'bugfix/BUG-456-fix-error',
      isFeature: false,
      isBugfix: true,
      isHotfix: false,
      ticketId: 'BUG-456',
      description: 'Fix error',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('[Bug] [BUG-456] Fix error');
  });

  it('handles missing description', () => {
    const info: BranchInfo = {
      name: 'feature/PROJ-123',
      isFeature: true,
      isBugfix: false,
      isHotfix: false,
      ticketId: 'PROJ-123',
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('[PROJ-123]');
  });

  it('returns empty string for empty info', () => {
    const info: BranchInfo = {
      name: 'main',
      isFeature: false,
      isBugfix: false,
      isHotfix: false,
    };

    const title = formatBranchAsCardTitle(info);
    expect(title).toBe('');
  });
});
