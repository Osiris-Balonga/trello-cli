import type { Member } from './member.js';

export interface Comment {
  id: string;
  text: string;
  author: Member;
  createdAt: Date;
  _raw: unknown;
}
