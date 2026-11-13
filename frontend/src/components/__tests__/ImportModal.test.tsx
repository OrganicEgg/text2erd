import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportModal, MAX_IMPORT_BYTES } from '../ImportModal';

describe('ImportModal component', () => {
  it('renders file upload dropzone and byte size counter', () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Import SQL DDL')).toBeInTheDocument();
    expect(screen.getByText(/0 B \/ 500\.0 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports \.sql, \.ddl, \.txt/i)).toBeInTheDocument();
  });

  it('disables Import button when SQL input exceeds MAX_IMPORT_BYTES', () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/CREATE TABLE users/i);
    const oversizedSql = 'A'.repeat(MAX_IMPORT_BYTES + 100);
    fireEvent.change(textarea, { target: { value: oversizedSql } });

    const importBtn = screen.getByRole('button', { name: /Import to Canvas/i });
    expect(importBtn).toBeDisabled();
  });
});
