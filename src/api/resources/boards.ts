import type { AxiosInstance } from 'axios';
import type { Board, TrelloAction } from '../types.js';

export class BoardsResource {
  constructor(private api: AxiosInstance) {}

  async get(boardId: string): Promise<Board> {
    const { data } = await this.api.get<Board>(`/boards/${boardId}`);
    return data;
  }

  async listByMember(memberId: string = 'me'): Promise<Board[]> {
    const { data } = await this.api.get<Board[]>(
      `/members/${memberId}/boards`,
      {
        params: {
          filter: 'open',
        },
      }
    );
    return data;
  }

  async getActions(
    boardId: string,
    params?: { filter?: string; limit?: number }
  ): Promise<TrelloAction[]> {
    const { data } = await this.api.get<TrelloAction[]>(
      `/boards/${boardId}/actions`,
      { params }
    );
    return data;
  }
}
