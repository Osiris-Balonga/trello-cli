import type { Member, Label, List } from '../api/types.js';

export interface GlobalConfig {
  language?: string;
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

export interface ProjectConfig {
  boardId: string;
  boardName: string;
  authMode?: 'apikey' | 'oauth';
  members: Record<string, Member>;
  labels: Record<string, Label>;
  lists: {
    todo: List;
    doing: List;
    done: List;
    [key: string]: List;
  };
  lastSync: string | null;
}
