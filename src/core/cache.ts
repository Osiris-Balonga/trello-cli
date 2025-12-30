import fs from 'fs/promises';
import path from 'path';
import type { ProjectConfig } from '../types/config.js';
import type { Member, Label, List } from '../api/types.js';

export class Cache {
  private data: ProjectConfig | null = null;
  private cachePath: string;

  constructor(projectPath: string = process.cwd()) {
    this.cachePath = path.join(projectPath, '.trello-cli.json');
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.cachePath);
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.cachePath, 'utf-8');
      this.data = JSON.parse(content);
    } catch {
      this.data = null;
    }
  }

  async save(): Promise<void> {
    if (!this.data) {
      throw new Error('No cache data to save');
    }

    const content = JSON.stringify(this.data, null, 2);

    await fs.writeFile(this.cachePath, content, {
      encoding: 'utf-8',
      mode: 0o600,
    });
  }

  async init(boardId: string, boardName: string): Promise<void> {
    this.data = {
      boardId,
      boardName,
      members: {},
      labels: {},
      lists: {} as ProjectConfig['lists'],
      lastSync: null,
    };
    await this.save();
  }

  getBoardId(): string | null {
    return this.data?.boardId || null;
  }

  getBoardName(): string | null {
    return this.data?.boardName || null;
  }

  getMembers(): Record<string, Member> {
    return this.data?.members || {};
  }

  getMemberByUsername(username: string): Member | undefined {
    const members = this.getMembers();
    return members[username.toLowerCase()];
  }

  setMembers(members: Member[]): void {
    if (!this.data) return;

    const indexed: Record<string, Member> = {};
    for (const member of members) {
      indexed[member.username.toLowerCase()] = member;
    }
    this.data.members = indexed;
  }

  getLabels(): Record<string, Label> {
    return this.data?.labels || {};
  }

  getLabelByName(name: string): Label | undefined {
    const labels = this.getLabels();
    return labels[name.toLowerCase()];
  }

  setLabels(labels: Label[]): void {
    if (!this.data) return;

    const indexed: Record<string, Label> = {};
    for (const label of labels) {
      if (label.name) {
        indexed[label.name.toLowerCase()] = label;
      }
    }
    this.data.labels = indexed;
  }

  getLists(): Record<string, List> {
    return this.data?.lists || {};
  }

  getListByAlias(alias: string): List | undefined {
    const lists = this.getLists();
    return lists[alias.toLowerCase()];
  }

  setLists(todo: List, doing: List, done: List): void {
    if (!this.data) return;

    this.data.lists = {
      todo,
      doing,
      done,
    };
  }

  updateSyncTime(): void {
    if (!this.data) return;
    this.data.lastSync = new Date().toISOString();
  }

  getLastSync(): string | null {
    return this.data?.lastSync || null;
  }

  isStale(ttlHours: number = 24): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;

    const syncDate = new Date(lastSync);
    const now = new Date();
    const hoursSinceSync =
      (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync > ttlHours;
  }

  getData(): ProjectConfig | null {
    return this.data;
  }
}
