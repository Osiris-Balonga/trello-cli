export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string;
  _raw: unknown;
  // Backwards compatibility alias
  fullName?: string;
}
