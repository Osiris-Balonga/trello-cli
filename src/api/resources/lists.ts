import type { AxiosInstance } from 'axios';
import type { List } from '../types.js';

export class ListsResource {
  constructor(private api: AxiosInstance) {}

  async get(listId: string): Promise<List> {
    const { data } = await this.api.get<List>(`/lists/${listId}`);
    return data;
  }

  async listByBoard(boardId: string): Promise<List[]> {
    const { data } = await this.api.get<List[]>(`/boards/${boardId}/lists`, {
      params: {
        filter: 'open',
      },
    });
    return data;
  }
}
