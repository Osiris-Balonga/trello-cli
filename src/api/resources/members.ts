import type { AxiosInstance } from 'axios';
import type { Member } from '../types.js';

export class MembersResource {
  constructor(private api: AxiosInstance) {}

  async get(memberId: string): Promise<Member> {
    const { data } = await this.api.get<Member>(`/members/${memberId}`);
    return data;
  }

  async listByBoard(boardId: string): Promise<Member[]> {
    const { data } = await this.api.get<Member[]>(
      `/boards/${boardId}/members`
    );
    return data;
  }
}
