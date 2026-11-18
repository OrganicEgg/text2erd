import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from '../ExportModal';
import type { Table, Relationship } from '../../types/erd';

const mockTables: Table[] = [
  {
    id: 'users',
    name: 'users',
    columns: [
      { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
      { name: 'email', type: 'varchar(255)', is_pk: false, is_nullable: false, is_unique: true },
    ],
  },
  {
    id: 'posts',
    name: 'posts',
    columns: [
      { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
      { name: 'user_id', type: 'int', is_pk: false, is_nullable: false, is_unique: false, is_fk: true },
    ],
  },
];

const mockRelationships: Relationship[] = [
  {
    id: 'rel_posts_user_id_users_id',
    source_table: 'posts',
    source_column: 'user_id',
    target_table: 'users',
    target_column: 'id',
  },
];

describe('ExportModal component', () => {
  it('switches to Mermaid ERD format and renders valid erDiagram output', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sql: 'CREATE TABLE "users" ("id" INT);' }),
    } as Response);

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        tables={mockTables}
        relationships={mockRelationships}
      />
    );

    const mermaidBtn = screen.getByRole('button', { name: /Mermaid ERD/i });
    fireEvent.click(mermaidBtn);

    expect(screen.getByText(/erDiagram/i)).toBeInTheDocument();
    expect(screen.getByText(/users \|\|--o\{ posts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download \.mmd/i })).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it('does NOT contain any github link or repository reference', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sql: 'CREATE TABLE "users" ("id" INT);' }),
    } as Response);

    const { container } = render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        tables={mockTables}
        relationships={mockRelationships}
      />
    );
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('href')).not.toContain('github');
    });
    expect(container.innerHTML).not.toContain('github.com');

    fetchSpy.mockRestore();
  });
});
