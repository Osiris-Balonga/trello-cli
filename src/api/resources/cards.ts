import type { AxiosInstance } from 'axios';
import type {
  Card,
  CreateCardParams,
  UpdateCardParams,
  TrelloAction,
} from '../types.js';

export class CardsResource {
  constructor(private api: AxiosInstance) {}

  async get(cardId: string): Promise<Card> {
    const { data } = await this.api.get<Card>(`/cards/${cardId}`);
    return data;
  }

  async listByBoard(boardId: string): Promise<Card[]> {
    const { data } = await this.api.get<Card[]>(`/boards/${boardId}/cards`, {
      params: {
        filter: 'open',
      },
    });
    return data;
  }

  async listByList(listId: string): Promise<Card[]> {
    const { data } = await this.api.get<Card[]>(`/lists/${listId}/cards`, {
      params: {
        filter: 'open',
      },
    });
    return data;
  }

  async create(params: CreateCardParams): Promise<Card> {
    const { data } = await this.api.post<Card>('/cards', params);
    return data;
  }

  async update(cardId: string, params: UpdateCardParams): Promise<Card> {
    const { data } = await this.api.put<Card>(`/cards/${cardId}`, params);
    return data;
  }

  async delete(cardId: string): Promise<void> {
    await this.api.delete(`/cards/${cardId}`);
  }

  async move(cardId: string, listId: string): Promise<Card> {
    return this.update(cardId, { idList: listId });
  }

  async archive(cardId: string): Promise<Card> {
    return this.update(cardId, { closed: true });
  }

  async unarchive(cardId: string): Promise<Card> {
    return this.update(cardId, { closed: false });
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
}
