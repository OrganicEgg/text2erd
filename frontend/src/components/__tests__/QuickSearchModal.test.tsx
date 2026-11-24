import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickSearchModal } from '../QuickSearchModal';
import type { Table } from '../../types/erd';

const sampleTables: Table[] = [
  {
    id: 'users',
    name: 'users',
    color: 'blue',
    columns: [
      { name: 'id', type: 'uuid', is_pk: true, is_nullable: false, is_unique: false },
      { name: 'email', type: 'varchar(255)', is_pk: false, is_nullable: false, is_unique: true },
    ],
  },
  {
    id: 'invoices',
    name: 'invoices',
    color: 'amber',
    columns: [
      { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
      { name: 'amount_cents', type: 'bigint', is_pk: false, is_nullable: false, is_unique: false },
    ],
  },
  {
    id: 'posts',
    name: 'posts',
    columns: [
      { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
      { name: 'author_id', type: 'uuid', is_pk: false, is_nullable: false, is_unique: false, is_fk: true },
    ],
  },
];

describe('QuickSearchModal (Cmd+K)', () => {
  it('filters tables by table name, column name, and data type', () => {
    const onSelectTable = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickSearchModal
        isOpen={true}
        onClose={onClose}
        tables={sampleTables}
        onSelectTable={onSelectTable}
      />
    );

    const searchInput = screen.getByLabelText('Search tables and columns');
    expect(screen.getByText('3 of 3 tables')).toBeInTheDocument();

    // Search by column name ("amount_cents")
    fireEvent.change(searchInput, { target: { value: 'amount_cents' } });
    expect(screen.getByText('1 of 3 tables')).toBeInTheDocument();
    expect(screen.getByText('invoices')).toBeInTheDocument();
    expect(screen.queryByText('posts')).not.toBeInTheDocument();

    // Press Enter to select and focus the matched table
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(onSelectTable).toHaveBeenCalledWith('invoices');
    expect(onClose).toHaveBeenCalled();
  });

  it('filters tables by color coding pills and supports keyboard navigation', () => {
    const onSelectTable = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickSearchModal
        isOpen={true}
        onClose={onClose}
        tables={sampleTables}
        onSelectTable={onSelectTable}
      />
    );

    // Filter by Blue color pill
    fireEvent.click(screen.getByRole('button', { name: /Blue/i }));
    expect(screen.getByText('1 of 3 tables')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();

    // Reset filter to All
    fireEvent.click(screen.getByRole('button', { name: /All \(3\)/i }));
    expect(screen.getByText('3 of 3 tables')).toBeInTheDocument();

    // Navigate down with ArrowDown and select with Enter
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectTable).toHaveBeenCalledTimes(1);
  });
});
