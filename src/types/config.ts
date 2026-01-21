import type { ProviderType } from '../providers/provider.js';
import type { Member, Label, Column } from '../models/index.js';

export interface GlobalConfig {
  language?: string;
  defaultProvider?: ProviderType;
  providers?: {
    trello?: {
      authMode?: 'apikey' | 'oauth';
    };
    github?: {
      authMode?: 'token';
    };
    linear?: {
      authMode?: 'token';
    };
  };
  // Legacy support
  auth?: {
    apikey?: {
      key: string;
      token: string;
    };
    oauth?: {
      accessToken: string;
      refreshToken: string;
    };
  };
  authMode?: 'apikey' | 'oauth';
}

export interface TaskTemplate {
  name: string;
  description?: string;
  labels?: string[];
  column?: string;
  // Backwards compatibility alias
  list?: string;
}

export interface ProjectConfig {
  provider: ProviderType;
  boardId: string;
  boardName: string;
  currentMemberId?: string;
  members: Record<string, Member>;
  labels: Record<string, Label>;
  columns: Record<string, Column>;
  lastSync: string | null;
  templates?: Record<string, TaskTemplate>;
}

// Legacy types for migration
export interface LegacyList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

export interface LegacyProjectConfig {
  boardId: string;
  boardName: string;
  authMode?: 'apikey' | 'oauth';
  currentMemberId?: string;
  members: Record<string, unknown>;
  labels: Record<string, unknown>;
  lists: Record<string, LegacyList>;
  lastSync: string | null;
  templates?: Record<string, { name: string; description?: string; labels?: string[]; list?: string }>;
}

// Alias for backwards compatibility
export type CardTemplate = TaskTemplate;
