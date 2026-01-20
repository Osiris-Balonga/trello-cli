import fs from 'fs/promises';
import path from 'path';
import type { ProjectConfig, CardTemplate } from '../types/config.js';
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

  async init(boardId: string, boardName: string, currentMemberId?: string): Promise<void> {
    this.data = {
      boardId,
      boardName,
      currentMemberId,
      members: {},
      labels: {},
      lists: {},
      lastSync: null,
    };
    await this.save();
  }

  getCurrentMemberId(): string | undefined {
    return this.data?.currentMemberId;
  }

  setCurrentMemberId(memberId: string): void {
    if (!this.data) return;
    this.data.currentMemberId = memberId;
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

  getAllLists(): List[] {
    const lists = this.getLists();
    return Object.values(lists).sort((a, b) => a.pos - b.pos);
  }

  getListByName(name: string): List | undefined {
    const lists = this.getAllLists();
    const lowerName = name.toLowerCase();

    // Exact match first
    const exact = lists.find((l) => l.name.toLowerCase() === lowerName);
    if (exact) return exact;

    // Partial match (starts with)
    const partial = lists.find((l) => l.name.toLowerCase().startsWith(lowerName));
    if (partial) return partial;

    // Contains match
    return lists.find((l) => l.name.toLowerCase().includes(lowerName));
  }

  getListById(listId: string): List | undefined {
    const lists = this.getAllLists();
    return lists.find((l) => l.id === listId);
  }

  setAllLists(lists: List[]): void {
    if (!this.data) return;

    const indexed: Record<string, List> = {};
    for (const list of lists) {
      indexed[list.id] = list;
    }
    this.data.lists = indexed;
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

  getTemplates(): Record<string, CardTemplate> {
    return this.data?.templates || {};
  }

  getTemplate(name: string): CardTemplate | undefined {
    return this.data?.templates?.[name];
  }

  async saveTemplate(name: string, template: CardTemplate): Promise<void> {
    if (!this.data) return;

    if (!this.data.templates) {
      this.data.templates = {};
    }
    this.data.templates[name] = template;
    await this.save();
  }

  async deleteTemplate(name: string): Promise<void> {
    if (!this.data || !this.data.templates) return;

    delete this.data.templates[name];
    await this.save();
  }
}
