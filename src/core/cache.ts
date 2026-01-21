import fs from 'fs/promises';
import path from 'path';
import type {
  ProjectConfig,
  TaskTemplate,
  LegacyProjectConfig,
  GitHubColumnConfig,
} from '../types/config.js';
import type { Member, Label, Column } from '../models/index.js';
import type { ProviderType } from '../providers/provider.js';

const NEW_CONFIG_FILE = '.taskpilot.json';
const LEGACY_CONFIG_FILE = '.trello-cli.json';

export class Cache {
  private data: ProjectConfig | null = null;
  private cachePath: string;
  private legacyCachePath: string;

  constructor(projectPath: string = process.cwd()) {
    this.cachePath = path.join(projectPath, NEW_CONFIG_FILE);
    this.legacyCachePath = path.join(projectPath, LEGACY_CONFIG_FILE);
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.cachePath);
      return true;
    } catch {
      // Check for legacy config
      try {
        await fs.access(this.legacyCachePath);
        return true;
      } catch {
        return false;
      }
    }
  }

  async load(): Promise<void> {
    // Try new config first
    try {
      const content = await fs.readFile(this.cachePath, 'utf-8');
      this.data = JSON.parse(content);
      return;
    } catch {
      // Try legacy config
      try {
        const content = await fs.readFile(this.legacyCachePath, 'utf-8');
        const legacyData = JSON.parse(content) as LegacyProjectConfig;
        this.data = this.migrateLegacyConfig(legacyData);
        // Auto-save in new format
        await this.save();
      } catch {
        this.data = null;
      }
    }
  }

  private migrateLegacyConfig(legacy: LegacyProjectConfig): ProjectConfig {
    // Convert lists to columns
    const columns: Record<string, Column> = {};
    for (const [key, list] of Object.entries(legacy.lists || {})) {
      columns[key] = {
        id: list.id,
        name: list.name,
        position: list.pos,
        closed: list.closed,
        _raw: list,
      };
    }

    // Convert members
    const members: Record<string, Member> = {};
    for (const [key, m] of Object.entries(legacy.members || {})) {
      const member = m as { id: string; username: string; fullName: string; avatarUrl?: string; email?: string };
      members[key] = {
        id: member.id,
        username: member.username,
        displayName: member.fullName,
        avatarUrl: member.avatarUrl || null,
        email: member.email,
        _raw: member,
      };
    }

    // Convert labels
    const labels: Record<string, Label> = {};
    for (const [key, l] of Object.entries(legacy.labels || {})) {
      const label = l as { id: string; name: string; color?: string };
      labels[key] = {
        id: label.id,
        name: label.name,
        color: label.color || null,
        _raw: label,
      };
    }

    // Convert templates
    const templates: Record<string, TaskTemplate> = {};
    for (const [key, t] of Object.entries(legacy.templates || {})) {
      templates[key] = {
        name: t.name,
        description: t.description,
        labels: t.labels,
        column: t.list,
      };
    }

    return {
      provider: 'trello',
      boardId: legacy.boardId,
      boardName: legacy.boardName,
      currentMemberId: legacy.currentMemberId,
      members,
      labels,
      columns,
      lastSync: legacy.lastSync,
      templates: Object.keys(templates).length > 0 ? templates : undefined,
    };
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

    // Remove legacy file if it exists
    try {
      await fs.unlink(this.legacyCachePath);
    } catch {
      // Ignore if doesn't exist
    }
  }

  async init(
    provider: ProviderType,
    boardId: string,
    boardName: string,
    currentMemberId?: string
  ): Promise<void> {
    this.data = {
      provider,
      boardId,
      boardName,
      currentMemberId,
      members: {},
      labels: {},
      columns: {},
      lastSync: null,
    };
    await this.save();
  }

  getProvider(): ProviderType {
    return this.data?.provider ?? 'trello';
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

  getMemberById(memberId: string): Member | undefined {
    const members = Object.values(this.getMembers());
    return members.find((m) => m.id === memberId);
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

  getLabelById(labelId: string): Label | undefined {
    const labels = Object.values(this.getLabels());
    return labels.find((l) => l.id === labelId);
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

  getColumns(): Record<string, Column> {
    return this.data?.columns || {};
  }

  getAllColumns(): Column[] {
    const columns = this.getColumns();
    return Object.values(columns).sort((a, b) => a.position - b.position);
  }

  getColumnByName(name: string): Column | undefined {
    const columns = this.getAllColumns();
    const lowerName = name.toLowerCase();

    // Exact match first
    const exact = columns.find((c) => c.name.toLowerCase() === lowerName);
    if (exact) return exact;

    // Partial match (starts with)
    const partial = columns.find((c) => c.name.toLowerCase().startsWith(lowerName));
    if (partial) return partial;

    // Contains match
    return columns.find((c) => c.name.toLowerCase().includes(lowerName));
  }

  getColumnById(columnId: string): Column | undefined {
    const columns = this.getAllColumns();
    return columns.find((c) => c.id === columnId);
  }

  setColumns(columns: Column[]): void {
    if (!this.data) return;

    const indexed: Record<string, Column> = {};
    for (const column of columns) {
      indexed[column.id] = column;
    }
    this.data.columns = indexed;
  }

  // Aliases for backwards compatibility (List -> Column)
  getLists(): Record<string, Column> {
    return this.getColumns();
  }

  getAllLists(): Column[] {
    return this.getAllColumns();
  }

  getListByName(name: string): Column | undefined {
    return this.getColumnByName(name);
  }

  getListById(listId: string): Column | undefined {
    return this.getColumnById(listId);
  }

  setAllLists(lists: Column[]): void {
    this.setColumns(lists);
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

  getTemplates(): Record<string, TaskTemplate> {
    return this.data?.templates || {};
  }

  getTemplate(name: string): TaskTemplate | undefined {
    return this.data?.templates?.[name];
  }

  async saveTemplate(name: string, template: TaskTemplate): Promise<void> {
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

  // GitHub-specific methods
  getGitHubColumnConfigs(): GitHubColumnConfig[] {
    return this.data?.githubColumnConfigs || [];
  }

  setGitHubColumnConfigs(configs: GitHubColumnConfig[]): void {
    if (!this.data) return;
    this.data.githubColumnConfigs = configs;
  }

  getGitHubColumnConfigById(id: string): GitHubColumnConfig | undefined {
    const configs = this.getGitHubColumnConfigs();
    return configs.find((c) => c.id === id);
  }

  getGitHubColumnConfigByName(name: string): GitHubColumnConfig | undefined {
    const configs = this.getGitHubColumnConfigs();
    const lowerName = name.toLowerCase();
    return configs.find((c) => c.name.toLowerCase() === lowerName);
  }
}
