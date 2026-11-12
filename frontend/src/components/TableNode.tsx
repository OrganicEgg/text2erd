import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData, Column } from '../types/erd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faLink,
  faTrashCan,
  faPlus,
  faPen,
  faCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

export const TableNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as TableNodeData;
  const { table, onUpdateTable, onDeleteTable } = nodeData;

  const [isEditingName, setIsEditingName] = useState(false);
  const [tableNameInput, setTableNameInput] = useState(table.name);
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('varchar(255)');
  const [newColPk, setNewColPk] = useState(false);

  const handleSaveTableName = () => {
    const trimmed = tableNameInput.trim();
    if (trimmed && trimmed !== table.name) {
      onUpdateTable(id, { ...table, name: trimmed, id: trimmed });
    }
    setIsEditingName(false);
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const newCol: Column = {
      name: newColName.trim(),
      type: newColType.trim() || 'varchar(255)',
      is_pk: newColPk,
      is_nullable: !newColPk,
      is_unique: false,
    };
    onUpdateTable(id, {
      ...table,
      columns: [...table.columns, newCol],
    });
    setNewColName('');
    setNewColType('varchar(255)');
    setNewColPk(false);
    setIsAddingCol(false);
  };

  const handleDeleteColumn = (colName: string) => {
    onUpdateTable(id, {
      ...table,
      columns: table.columns.filter((c) => c.name !== colName),
    });
  };

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('serial') || t.includes('decimal') || t.includes('numeric') || t.includes('float')) {
      return 'text-sky-700 bg-sky-50 border-sky-200';
    }
    if (t.includes('varchar') || t.includes('char') || t.includes('text') || t.includes('string')) {
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
    if (t.includes('bool')) {
      return 'text-amber-700 bg-amber-50 border-amber-200';
    }
    if (t.includes('time') || t.includes('date')) {
      return 'text-purple-700 bg-purple-50 border-purple-200';
    }
    if (t.includes('uuid')) {
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    }
    return 'text-slate-600 bg-slate-100 border-slate-200';
  };

  return (
    <div className="group min-w-[240px] max-w-[320px] rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 transition-all duration-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/50 px-3.5 py-2.5 rounded-t-xl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-500/20" />
          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={tableNameInput}
                onChange={(e) => setTableNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTableName()}
                className="w-full rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-300"
                autoFocus
              />
              <button
                onClick={handleSaveTableName}
                className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                title="Save"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 truncate cursor-pointer group/title"
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
            >
              <span className="font-semibold text-xs text-slate-900 tracking-wide truncate">
                {table.name}
              </span>
              <FontAwesomeIcon
                icon={faPen}
                className="h-2.5 w-2.5 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
            {table.columns.length}
          </span>
          <button
            onClick={() => onDeleteTable(id)}
            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
            title="Delete table"
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-100">
        {table.columns.length === 0 ? (
          <div className="p-3 text-center text-[11px] text-slate-400 italic">
            No columns defined yet
          </div>
        ) : (
          table.columns.map((col) => (
            <div
              key={col.name}
              className="group/row relative flex items-center justify-between px-3.5 py-1.5 hover:bg-slate-50 transition-colors"
            >
              {/* Left Handle (Target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.name}-target`}
                className="!h-2.5 !w-2.5 !-left-1.5 !border-2 !border-white !bg-emerald-600 hover:!scale-125 transition-transform"
                title={`Target: ${table.name}.${col.name}`}
              />

              {/* Column Name & Badges */}
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                {col.is_pk && (
                  <span title="Primary Key">
                    <FontAwesomeIcon icon={faKey} className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                  </span>
                )}
                {col.is_fk && (
                  <span title="Foreign Key">
                    <FontAwesomeIcon icon={faLink} className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                  </span>
                )}
                <span
                  className={`text-xs truncate ${
                    col.is_pk
                      ? 'font-semibold text-slate-900'
                      : col.is_fk
                      ? 'font-medium text-emerald-800'
                      : 'text-slate-700'
                  }`}
                >
                  {col.name}
                </span>
              </div>

              {/* Type Badge & Delete action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-mono leading-none ${getTypeColor(
                    col.type
                  )}`}
                >
                  {col.type}
                </span>
                <button
                  onClick={() => handleDeleteColumn(col.name)}
                  className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                  title="Remove column"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Right Handle (Source) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.name}-source`}
                className="!h-2.5 !w-2.5 !-right-1.5 !border-2 !border-white !bg-teal-600 hover:!scale-125 transition-transform"
                title={`Source: ${table.name}.${col.name}`}
              />
            </div>
          ))
        )}
      </div>

      {/* Add Column Expandable Form */}
      {isAddingCol ? (
        <div className="border-t border-slate-200 bg-slate-50/80 p-2.5 space-y-2 rounded-b-xl">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="column_name"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="flex-1 rounded bg-white px-2 py-1 text-xs text-slate-900 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="data_type"
              value={newColType}
              onChange={(e) => setNewColType(e.target.value)}
              className="w-24 rounded bg-white px-2 py-1 text-xs text-slate-900 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newColPk}
                onChange={(e) => setNewColPk(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Primary Key</span>
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setIsAddingCol(false)}
                className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                className="rounded bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 p-1.5 rounded-b-xl bg-slate-50/40">
          <button
            onClick={() => setIsAddingCol(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
            <span>Add Column</span>
          </button>
        </div>
      )}
    </div>
  );
};
