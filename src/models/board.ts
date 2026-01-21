export interface Board {
  id: string;
  name: string;
  description: string | null;
  url: string;
  closed: boolean;
  _raw: unknown;
}

export interface BoardWithRelations extends Board {
  columns: import('./column.js').Column[];
  members: import('./member.js').Member[];
  labels: import('./label.js').Label[];
}
