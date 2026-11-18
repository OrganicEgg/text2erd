import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { TableNode } from '../TableNode';
import type { Table } from '../../types/erd';

const sampleTable: Table = {
  id: 'users',
  name: 'users',
  columns: [
    { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
    { name: 'email', type: 'varchar(255)', is_pk: false, is_nullable: false, is_unique: true },
  ],
};

function renderTableNode(isLocked: boolean, onUpdateTable = vi.fn(), onDeleteTable = vi.fn()) {
  const props = {
    id: 'users',
    type: 'tableNode',
    data: {
      table: sampleTable,
      onUpdateTable,
      onDeleteTable,
      isLocked,
    },
    selected: false,
    isConnectable: !isLocked,
    zIndex: 1,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
  };

  return render(
    <ReactFlowProvider>
      <TableNode {...(props as any)} />
    </ReactFlowProvider>
  );
}

describe('TableNode component lock/unlock behavior', () => {
  it('allows table deletion, column addition, column removal, and renaming when unlocked', () => {
    const onUpdateTable = vi.fn();
    const onDeleteTable = vi.fn();
    renderTableNode(false, onUpdateTable, onDeleteTable);

    // Delete table button is present when unlocked
    const deleteTableBtn = screen.getByTitle('Delete table');
    expect(deleteTableBtn).toBeInTheDocument();
    fireEvent.click(deleteTableBtn);
    expect(onDeleteTable).toHaveBeenCalledWith('users');

    // Remove column buttons are present when unlocked
    const removeColBtns = screen.getAllByTitle('Remove column');
    expect(removeColBtns).toHaveLength(2);
    fireEvent.click(removeColBtns[1]);
    expect(onUpdateTable).toHaveBeenCalledWith('users', {
      ...sampleTable,
      columns: [sampleTable.columns[0]],
    });

    // Add Column button is present and opens form
    const addColBtn = screen.getByText('Add Column');
    expect(addColBtn).toBeInTheDocument();
    fireEvent.click(addColBtn);
    expect(screen.getByPlaceholderText('column_name')).toBeInTheDocument();

    // Clicking table title activates inline rename input
    fireEvent.click(screen.getByText('users'));
    expect(screen.getByDisplayValue('users')).toBeInTheDocument();
  });

  it('enforces read-only mode when canvas is locked', () => {
    const onUpdateTable = vi.fn();
    const onDeleteTable = vi.fn();
    renderTableNode(true, onUpdateTable, onDeleteTable);

    // Edit/delete controls must be hidden
    expect(screen.queryByTitle('Delete table')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove column')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Column')).not.toBeInTheDocument();

    // Clicking table name should NOT open rename input when locked
    fireEvent.click(screen.getByText('users'));
    expect(screen.queryByDisplayValue('users')).not.toBeInTheDocument();
    expect(onUpdateTable).not.toHaveBeenCalled();
  });

  it('closes active inline rename and add column forms when locked', () => {
    const onUpdateTable = vi.fn();
    const onDeleteTable = vi.fn();
    const baseProps = {
      id: 'users',
      type: 'tableNode',
      selected: false,
      zIndex: 1,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
      dragging: false,
    };

    const { rerender } = render(
      <ReactFlowProvider>
        <TableNode
          {...(baseProps as any)}
          isConnectable={true}
          data={{
            table: sampleTable,
            onUpdateTable,
            onDeleteTable,
            isLocked: false,
          }}
        />
      </ReactFlowProvider>
    );

    // Activate inline rename and Add Column form while unlocked
    fireEvent.click(screen.getByText('users'));
    expect(screen.getByDisplayValue('users')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add Column'));
    expect(screen.getByPlaceholderText('column_name')).toBeInTheDocument();

    // Now lock the canvas
    rerender(
      <ReactFlowProvider>
        <TableNode
          {...(baseProps as any)}
          isConnectable={false}
          data={{
            table: sampleTable,
            onUpdateTable,
            onDeleteTable,
            isLocked: true,
          }}
        />
      </ReactFlowProvider>
    );

    // Inline inputs must immediately close
    expect(screen.queryByDisplayValue('users')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('column_name')).not.toBeInTheDocument();
  });
});
