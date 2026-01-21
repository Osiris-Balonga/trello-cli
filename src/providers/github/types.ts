export interface GitHubAuthConfig {
  type: 'pat' | 'oauth';
  token: string;
}

export interface GitHubClientConfig {
  auth: GitHubAuthConfig;
  baseURL?: string;
  timeout?: number;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser | null;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization' | 'Bot';
}

export interface GitHubLabel {
  id: number;
  node_id: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  due_on: string | null;
}

export interface GitHubComment {
  id: number;
  node_id: string;
  body: string;
  user: GitHubUser | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubCollaborator extends GitHubUser {
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubCreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface GitHubUpdateIssueParams {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
  milestone?: number | null;
}

export interface GitHubDeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface GitHubAccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubDeviceFlowError {
  error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied';
  error_description: string;
}

export interface ColumnConfig {
  id: string;
  name: string;
  labelName: string | null;
  isClosedState: boolean;
}
