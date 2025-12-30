import type { AxiosInstance } from 'axios';
import type { Label } from '../types.js';

export class LabelsResource {
  constructor(private api: AxiosInstance) {}

  async get(labelId: string): Promise<Label> {
    const { data } = await this.api.get<Label>(`/labels/${labelId}`);
    return data;
  }

  async listByBoard(boardId: string): Promise<Label[]> {
    const { data } = await this.api.get<Label[]>(`/boards/${boardId}/labels`);
    return data;
  }
}
