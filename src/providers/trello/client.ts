import axios from 'axios';
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  TrelloAuthConfig,
  TrelloClientConfig,
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloMember,
  TrelloLabel,
  TrelloAction,
  TrelloCreateCardParams,
  TrelloUpdateCardParams,
} from './types.js';
import {
  TrelloAPIError,
  TrelloAuthError,
  TrelloRateLimitError,
  TrelloNetworkError,
} from '../../utils/errors.js';
import { apiLimiter } from '../../utils/rate-limiter.js';

export class TrelloClient {
  private api: AxiosInstance;
  private auth: TrelloAuthConfig;

  constructor(config: TrelloClientConfig) {
    this.auth = config.auth;

    this.api = axios.create({
      baseURL: config.baseURL || 'https://api.trello.com/1',
      timeout: config.timeout || 10000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        await apiLimiter(() => Promise.resolve());

        if (this.auth.type === 'apikey') {
          config.params = {
            ...config.params,
            key: this.auth.apiKey,
            token: this.auth.token,
          };
        } else if (this.auth.type === 'oauth') {
          config.params = {
            ...config.params,
            key: this.auth.orgApiKey,
            token: this.auth.token,
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        if (!error.response) {
          const isTimeout =
            error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
          const isOffline =
            error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH';
          throw new TrelloNetworkError(isTimeout, isOffline);
        }
        if (error.response.status === 401) {
          throw new TrelloAuthError();
        }
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new TrelloRateLimitError(
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        throw new TrelloAPIError(error);
      }
    );
  }

  async getMe(): Promise<TrelloMember> {
    const { data } = await this.api.get<TrelloMember>('/members/me');
    return data;
  }

  async listBoards(memberId: string = 'me'): Promise<TrelloBoard[]> {
    const { data } = await this.api.get<TrelloBoard[]>(
      `/members/${memberId}/boards`,
      { params: { filter: 'open' } }
    );
    return data;
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    const { data } = await this.api.get<TrelloBoard>(`/boards/${boardId}`);
    return data;
  }

  async getBoardActions(
    boardId: string,
    params?: { filter?: string; limit?: number }
  ): Promise<TrelloAction[]> {
    const { data } = await this.api.get<TrelloAction[]>(
      `/boards/${boardId}/actions`,
      { params }
    );
    return data;
  }

  async listLists(boardId: string): Promise<TrelloList[]> {
    const { data } = await this.api.get<TrelloList[]>(
      `/boards/${boardId}/lists`,
      { params: { filter: 'open' } }
    );
    return data;
  }

  async getList(listId: string): Promise<TrelloList> {
    const { data } = await this.api.get<TrelloList>(`/lists/${listId}`);
    return data;
  }

  async listCards(boardId: string): Promise<TrelloCard[]> {
    const { data } = await this.api.get<TrelloCard[]>(
      `/boards/${boardId}/cards`,
      { params: { filter: 'open' } }
    );
    return data;
  }

  async listCardsByList(listId: string): Promise<TrelloCard[]> {
    const { data } = await this.api.get<TrelloCard[]>(`/lists/${listId}/cards`, {
      params: { filter: 'open' },
    });
    return data;
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    const { data } = await this.api.get<TrelloCard>(`/cards/${cardId}`);
    return data;
  }

  async createCard(params: TrelloCreateCardParams): Promise<TrelloCard> {
    const { data } = await this.api.post<TrelloCard>('/cards', params);
    return data;
  }

  async updateCard(cardId: string, params: TrelloUpdateCardParams): Promise<TrelloCard> {
    const { data } = await this.api.put<TrelloCard>(`/cards/${cardId}`, params);
    return data;
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.api.delete(`/cards/${cardId}`);
  }

  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.updateCard(cardId, { closed: true });
  }

  async unarchiveCard(cardId: string): Promise<TrelloCard> {
    return this.updateCard(cardId, { closed: false });
  }

  async addComment(cardId: string, text: string): Promise<TrelloAction> {
    const { data } = await this.api.post<TrelloAction>(
      `/cards/${cardId}/actions/comments`,
      { text }
    );
    return data;
  }

  async getComments(cardId: string): Promise<TrelloAction[]> {
    const { data } = await this.api.get<TrelloAction[]>(
      `/cards/${cardId}/actions`,
      { params: { filter: 'commentCard' } }
    );
    return data;
  }

  async addLabel(cardId: string, labelId: string): Promise<void> {
    await this.api.post(`/cards/${cardId}/idLabels`, { value: labelId });
  }

  async removeLabel(cardId: string, labelId: string): Promise<void> {
    await this.api.delete(`/cards/${cardId}/idLabels/${labelId}`);
  }

  async addMember(cardId: string, memberId: string): Promise<void> {
    await this.api.post(`/cards/${cardId}/idMembers`, { value: memberId });
  }

  async removeMember(cardId: string, memberId: string): Promise<void> {
    await this.api.delete(`/cards/${cardId}/idMembers/${memberId}`);
  }

  async listMembers(boardId: string): Promise<TrelloMember[]> {
    const { data } = await this.api.get<TrelloMember[]>(
      `/boards/${boardId}/members`
    );
    return data;
  }

  async getMember(memberId: string): Promise<TrelloMember> {
    const { data } = await this.api.get<TrelloMember>(`/members/${memberId}`);
    return data;
  }

  async listLabels(boardId: string): Promise<TrelloLabel[]> {
    const { data } = await this.api.get<TrelloLabel[]>(
      `/boards/${boardId}/labels`
    );
    return data;
  }

  async getLabel(labelId: string): Promise<TrelloLabel> {
    const { data } = await this.api.get<TrelloLabel>(`/labels/${labelId}`);
    return data;
  }

  // Backwards compatibility: Resource accessors for old API
  private _cards?: CardsResource;
  private _boards?: BoardsResource;
  private _lists?: ListsResource;
  private _members?: MembersResource;
  private _labels?: LabelsResource;

  get cards(): CardsResource {
    return (this._cards ??= new CardsResource(this));
  }

  get boards(): BoardsResource {
    return (this._boards ??= new BoardsResource(this));
  }

  get lists(): ListsResource {
    return (this._lists ??= new ListsResource(this));
  }

  get members(): MembersResource {
    return (this._members ??= new MembersResource(this));
  }

  get labels(): LabelsResource {
    return (this._labels ??= new LabelsResource(this));
  }
}

// Backwards compatibility resource classes
class CardsResource {
  constructor(private client: TrelloClient) {}

  get = (cardId: string): Promise<TrelloCard> => this.client.getCard(cardId);
  listByBoard = (boardId: string): Promise<TrelloCard[]> => this.client.listCards(boardId);
  listByList = (listId: string): Promise<TrelloCard[]> => this.client.listCardsByList(listId);
  create = (params: TrelloCreateCardParams): Promise<TrelloCard> => this.client.createCard(params);
  update = (cardId: string, params: TrelloUpdateCardParams): Promise<TrelloCard> => this.client.updateCard(cardId, params);
  delete = (cardId: string): Promise<void> => this.client.deleteCard(cardId);
  move = (cardId: string, listId: string): Promise<TrelloCard> => this.client.updateCard(cardId, { idList: listId });
  archive = (cardId: string): Promise<TrelloCard> => this.client.archiveCard(cardId);
  unarchive = (cardId: string): Promise<TrelloCard> => this.client.unarchiveCard(cardId);
  addComment = (cardId: string, text: string): Promise<TrelloAction> => this.client.addComment(cardId, text);
  getComments = (cardId: string): Promise<TrelloAction[]> => this.client.getComments(cardId);
  addLabel = (cardId: string, labelId: string): Promise<void> => this.client.addLabel(cardId, labelId);
  removeLabel = (cardId: string, labelId: string): Promise<void> => this.client.removeLabel(cardId, labelId);
  addMember = (cardId: string, memberId: string): Promise<void> => this.client.addMember(cardId, memberId);
  removeMember = (cardId: string, memberId: string): Promise<void> => this.client.removeMember(cardId, memberId);
}

class BoardsResource {
  constructor(private client: TrelloClient) {}

  get = (boardId: string): Promise<TrelloBoard> => this.client.getBoard(boardId);
  listByMember = (memberId?: string): Promise<TrelloBoard[]> => this.client.listBoards(memberId);
  getActions = (boardId: string, params?: { filter?: string; limit?: number }): Promise<TrelloAction[]> =>
    this.client.getBoardActions(boardId, params);
}

class ListsResource {
  constructor(private client: TrelloClient) {}

  get = (listId: string): Promise<TrelloList> => this.client.getList(listId);
  listByBoard = (boardId: string): Promise<TrelloList[]> => this.client.listLists(boardId);
}

class MembersResource {
  constructor(private client: TrelloClient) {}

  getMe = (): Promise<TrelloMember> => this.client.getMe();
  get = (memberId: string): Promise<TrelloMember> => this.client.getMember(memberId);
  listByBoard = (boardId: string): Promise<TrelloMember[]> => this.client.listMembers(boardId);
}

class LabelsResource {
  constructor(private client: TrelloClient) {}

  get = (labelId: string): Promise<TrelloLabel> => this.client.getLabel(labelId);
  listByBoard = (boardId: string): Promise<TrelloLabel[]> => this.client.listLabels(boardId);
}
