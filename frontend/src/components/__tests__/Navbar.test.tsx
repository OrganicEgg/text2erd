import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../Navbar';

describe('Navbar component', () => {
  const defaultProps = {
    onAddTable: vi.fn(),
    onAutoLayout: vi.fn(),
    onOpenImport: vi.fn(),
    onOpenExport: vi.fn(),
    isEditorOpen: true,
    onToggleEditor: vi.fn(),
    tableCount: 3,
    relCount: 2,
    onNavigateHome: vi.fn(),
  };

  it('renders Text2ERD branding, home button, and table counters', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getAllByText('Text2ERD').length).toBeGreaterThanOrEqual(2);
    const homeBtn = screen.getByTitle('Return to Text2ERD Home');
    expect(homeBtn).toBeInTheDocument();
    expect(homeBtn).toHaveTextContent('Text2ERD');
    fireEvent.click(homeBtn);
    expect(defaultProps.onNavigateHome).toHaveBeenCalledTimes(1);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('tables')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('relations')).toBeInTheDocument();
  });

  it('triggers callbacks when buttons are clicked', () => {
    render(<Navbar {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Table'));
    expect(defaultProps.onAddTable).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Auto Layout'));
    expect(defaultProps.onAutoLayout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Import SQL'));
    expect(defaultProps.onOpenImport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Export SQL'));
    expect(defaultProps.onOpenExport).toHaveBeenCalledTimes(1);
  });

  it('toggles lock state and triggers onToggleLock', () => {
    const onToggleLock = vi.fn();
    const { rerender } = render(
      <Navbar {...defaultProps} isLocked={false} onToggleLock={onToggleLock} />
    );

    const lockBtn = screen.getByText('Lock');
    expect(lockBtn).toBeInTheDocument();
    fireEvent.click(lockBtn);
    expect(onToggleLock).toHaveBeenCalledTimes(1);

    rerender(<Navbar {...defaultProps} isLocked={true} onToggleLock={onToggleLock} />);
    expect(screen.getByText('Unlock')).toBeInTheDocument();
  });

  it('triggers onOpenSearch and onOpenImageExport when v1.1 toolbar buttons are clicked', () => {
    const onOpenSearch = vi.fn();
    const onOpenImageExport = vi.fn();
    render(
      <Navbar
        {...defaultProps}
        onOpenSearch={onOpenSearch}
        onOpenImageExport={onOpenImageExport}
      />
    );

    fireEvent.click(screen.getByTitle(/Quick search tables/i));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle(/Export high-resolution PNG or SVG/i));
    expect(onOpenImageExport).toHaveBeenCalledTimes(1);
  });

  it('does NOT contain any github link or repository reference', () => {
    const { container } = render(<Navbar {...defaultProps} />);
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('href')).not.toContain('github');
    });
    expect(container.innerHTML).not.toContain('github.com');
  });
});
