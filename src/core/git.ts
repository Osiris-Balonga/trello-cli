import simpleGit, { SimpleGit } from 'simple-git';

let gitInstance: SimpleGit | null = null;

function getGit(): SimpleGit {
  if (!gitInstance) {
    gitInstance = simpleGit();
  }
  return gitInstance;
}

export interface BranchInfo {
  name: string;
  isFeature: boolean;
  isBugfix: boolean;
  isHotfix: boolean;
  ticketId?: string;
  description?: string;
}

const BRANCH_PATTERNS = {
  feature: /^feature[/-]/i,
  bugfix: /^(bugfix|fix)[/-]/i,
  hotfix: /^hotfix[/-]/i,
  ticket: /^(?:feature|bugfix|fix|hotfix)?[/-]?([A-Z]+-\d+)/i,
  description: /^(?:feature|bugfix|fix|hotfix)?[/-]?(?:[A-Z]+-\d+[/-])?(.+)$/i,
};

export function parseBranchName(branchName: string): BranchInfo {
  const name = branchName.trim();

  const ticketMatch = name.match(BRANCH_PATTERNS.ticket);
  const descMatch = name.match(BRANCH_PATTERNS.description);

  let description = descMatch?.[1] || name;
  description = description
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    name,
    isFeature: BRANCH_PATTERNS.feature.test(name),
    isBugfix: BRANCH_PATTERNS.bugfix.test(name),
    isHotfix: BRANCH_PATTERNS.hotfix.test(name),
    ticketId: ticketMatch?.[1],
    description: description || undefined,
  };
}

export async function getCurrentBranch(): Promise<string | null> {
  try {
    const git = getGit();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim() || null;
  } catch {
    return null;
  }
}

export async function getCurrentBranchInfo(): Promise<BranchInfo | null> {
  const branchName = await getCurrentBranch();
  if (!branchName) {
    return null;
  }
  return parseBranchName(branchName);
}

export async function isGitRepository(): Promise<boolean> {
  try {
    const git = getGit();
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

export function formatBranchAsCardTitle(branchInfo: BranchInfo): string {
  const parts: string[] = [];

  // Add prefix based on branch type
  if (branchInfo.isBugfix) {
    parts.push('[Bug]');
  } else if (branchInfo.isHotfix) {
    parts.push('[Hotfix]');
  }

  // Add ticket ID if present
  if (branchInfo.ticketId) {
    parts.push(`[${branchInfo.ticketId}]`);
  }

  // Add description
  if (branchInfo.description) {
    parts.push(branchInfo.description);
  }

  return parts.join(' ').trim();
}

export async function suggestCardTitleFromBranch(): Promise<string | null> {
  const branchInfo = await getCurrentBranchInfo();
  if (!branchInfo) {
    return null;
  }

  // Skip main/master/develop branches
  const skipBranches = ['main', 'master', 'develop', 'dev', 'staging', 'production'];
  if (skipBranches.includes(branchInfo.name.toLowerCase())) {
    return null;
  }

  return formatBranchAsCardTitle(branchInfo);
}
