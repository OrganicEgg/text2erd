import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../ExportModal';
import * as imageExport from '../../utils/imageExport';
import type { Table, Relationship } from '../../types/erd';

const mockTables: Table[] = [
  {
    id: 'users',
    name: 'users',
    color: 'blue',
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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('switches to Mermaid ERD format and renders valid erDiagram output', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

    await waitFor(() => {
      expect(screen.getByText(/CREATE TABLE "users"/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mermaid ERD/i }));

    expect(screen.getByText(/erDiagram/i)).toBeInTheDocument();
    expect(screen.getByText(/users \|\|--o\{ posts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download \.mmd/i })).toBeInTheDocument();
  });

  it('switches to Prisma and DBML formats and generates accurate schema definitions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

    await waitFor(() => {
      expect(screen.getByText(/CREATE TABLE "users"/i)).toBeInTheDocument();
    });

    // Prisma tab
    fireEvent.click(screen.getByRole('button', { name: /^Prisma$/i }));
    expect(screen.getByText(/model Users \{/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Prisma/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download \.prisma/i })).toBeInTheDocument();

    // DBML tab
    fireEvent.click(screen.getByRole('button', { name: /^DBML$/i }));
    expect(screen.getByText(/Table users \[headercolor: #0284c7\]/i)).toBeInTheDocument();
    expect(screen.getByText(/Ref: posts\.user_id > users\.id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy DBML/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download \.dbml/i })).toBeInTheDocument();
  });

  it('renders high-resolution PNG and SVG canvas snapshots with background and resolution controls', async () => {
    const snapshotSpy = vi
      .spyOn(imageExport, 'generateCanvasImageDataUrl')
      .mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    const downloadSpy = vi.spyOn(imageExport, 'triggerDataUrlDownload').mockImplementation(() => {});

    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        tables={mockTables}
        relationships={mockRelationships}
        initialFormat="png"
      />
    );

    await waitFor(() => {
      expect(screen.getByAltText(/Exported ERD \(PNG\)/i)).toBeInTheDocument();
    });

    expect(snapshotSpy).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'png', background: 'light', pixelRatio: 2 })
    );

    // Switch resolution to 3x Ultra HD
    fireEvent.click(screen.getByRole('button', { name: /3x Ultra HD/i }));
    await waitFor(() => {
      expect(snapshotSpy).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'png', pixelRatio: 3 })
      );
    });

    // Download PNG
    fireEvent.click(screen.getByRole('button', { name: /Download \.png/i }));
    expect(downloadSpy).toHaveBeenCalledWith(expect.stringContaining('data:image/png'), 'text2erd_diagram.png');

    // Switch to SVG Vector
    snapshotSpy.mockResolvedValueOnce('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E');
    fireEvent.click(screen.getByRole('button', { name: /SVG Vector/i }));
    await waitFor(() => {
      expect(screen.getByAltText(/Exported ERD \(SVG\)/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Download \.svg/i })).toBeInTheDocument();
  });

  it('does NOT contain any github link or repository reference', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

    await waitFor(() => {
      expect(screen.getByText(/CREATE TABLE "users"/i)).toBeInTheDocument();
    });

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('href')).not.toContain('github');
    });
    expect(container.innerHTML).not.toContain('github.com');
  });
});
