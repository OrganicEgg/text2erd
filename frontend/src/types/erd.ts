export interface Column {
  name: string;
  type: string;
  is_pk: boolean;
  is_fk?: boolean;
  is_unique?: boolean;
  is_nullable?: boolean;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
}

export interface Relationship {
  id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  type?: string;
}

export interface DiagramData {
  tables: Table[];
  relationships: Relationship[];
}

export interface TableNodeData extends Record<string, unknown> {
  table: Table;
  onUpdateTable: (tableId: string, updated: Table) => void;
  onDeleteTable: (tableId: string) => void;
}
