export interface AuthConfig {
  type: 'apikey' | 'oauth';
  apiKey?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface TrelloConfig {
  auth: AuthConfig;
  baseURL?: string;
  timeout?: number;
}

export interface Board {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
}

export interface List {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

export interface Card {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  idList: string;
  idBoard: string;
  due: string | null;
  start: string | null;
  dueComplete: boolean;
  idMembers: string[];
  idLabels: string[];
  url: string;
  shortUrl: string;
  dateLastActivity: string;
}

export interface Member {
  id: string;
  username: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  email?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  idBoard: string;
}

export interface CreateCardParams {
  name: string;
  idList: string;
  desc?: string;
  due?: string;
  start?: string;
  dueComplete?: boolean;
  idLabels?: string[];
  idMembers?: string[];
  pos?: 'top' | 'bottom' | number;
}

export interface UpdateCardParams {
  name?: string;
  desc?: string;
  closed?: boolean;
  idList?: string;
  due?: string;
  start?: string;
  dueComplete?: boolean;
  idLabels?: string[];
  idMembers?: string[];
  pos?: 'top' | 'bottom' | number;
}
