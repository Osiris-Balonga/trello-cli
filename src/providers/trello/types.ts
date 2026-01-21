export interface TrelloAuthConfig {
  type: 'apikey' | 'oauth';
  apiKey?: string;
  token?: string;
  orgApiKey?: string;
}

export interface TrelloClientConfig {
  auth: TrelloAuthConfig;
  baseURL?: string;
  timeout?: number;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

export interface TrelloCard {
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
  labels?: TrelloLabel[];
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  email?: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
  idBoard: string;
}

export interface TrelloCreateCardParams {
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

export interface TrelloUpdateCardParams {
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

export interface TrelloAction {
  id: string;
  type: string;
  date: string;
  memberCreator?: {
    id: string;
    username: string;
    fullName: string;
  };
  data: {
    text?: string;
    card?: {
      id: string;
      name: string;
      closed?: boolean;
    };
    listAfter?: {
      id: string;
      name: string;
    };
    listBefore?: {
      id: string;
      name: string;
    };
  };
}
