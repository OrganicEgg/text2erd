import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData, Column } from '../types/erd';
import { Key, Link, Trash2, Plus, Edit2, Check, X } from 'lucide-react';

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
      return 'text-sky-400 bg-sky-950/50 border-sky-800/40';
    }
    if (t.includes('varchar') || t.includes('char') || t.includes('text') || t.includes('string')) {
      return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40';
    }
    if (t.includes('bool')) {
      return 'text-amber-400 bg-amber-950/50 border-amber-800/40';
    }
    if (t.includes('time') || t.includes('date')) {
      return 'text-purple-400 bg-purple-950/50 border-purple-800/40';
    }
    if (t.includes('uuid')) {
      return 'text-pink-400 bg-pink-950/50 border-pink-800/40';
    }
    return 'text-slate-400 bg-slate-800/60 border-slate-700/50';
  };

  return (
    <div className="group min-w-[240px] max-w-[320px] rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-xl shadow-black/50 backdrop-blur-md transition-all duration-200 hover:border-indigo-500/80 hover:shadow-indigo-500/10">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-800/90 to-slate-900/90 px-3.5 py-2.5 rounded-t-xl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30" />
          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={tableNameInput}
                onChange={(e) => setTableNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTableName()}
                className="w-full rounded bg-slate-950 px-1.5 py-0.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 border border-slate-700"
                autoFocus
              />
              <button
                onClick={handleSaveTableName}
                className="p-1 text-emerald-400 hover:text-emerald-300"
                title="Save"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 truncate cursor-pointer group/title"
              onClick={() => setIsEditingName(true)}
              title="Click to rename"
            >
              <span className="font-semibold text-xs text-slate-100 tracking-wide truncate">
                {table.name}
              </span>
              <Edit2 className="h-2.5 w-2.5 text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/50">
            {table.columns.length}
          </span>
          <button
            onClick={() => onDeleteTable(id)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
            title="Delete table"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-slate-800/40">
        {table.columns.length === 0 ? (
          <div className="p-3 text-center text-[11px] text-slate-500 italic">
            No columns yet
          </div>
        ) : (
          table.columns.map((col) => (
            <div
              key={col.name}
              className="group/row relative flex items-center justify-between px-3.5 py-1.5 hover:bg-slate-800/40 transition-colors"
            >
              {/* Left Handle (Target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${col.name}-target`}
                className="!h-2.5 !w-2.5 !-left-1.5 !border-2 !border-slate-900 !bg-indigo-400 hover:!scale-125 transition-transform"
                title={`Target: ${table.name}.${col.name}`}
              />

              {/* Column Name & Badges */}
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                {col.is_pk && (
                  <span title="Primary Key">
                    <Key className="h-3 w-3 text-amber-400 shrink-0" />
                  </span>
                )}
                {col.is_fk && (
                  <span title="Foreign Key">
                    <Link className="h-3 w-3 text-cyan-400 shrink-0" />
                  </span>
                )}
                <span
                  className={`text-xs truncate ${
                    col.is_pk
                      ? 'font-medium text-amber-200'
                      : col.is_fk
                      ? 'text-cyan-200'
                      : 'text-slate-300'
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
                  className="opacity-0 group-hover/row:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                  title="Remove column"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Right Handle (Source) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${col.name}-source`}
                className="!h-2.5 !w-2.5 !-right-1.5 !border-2 !border-slate-900 !bg-cyan-400 hover:!scale-125 transition-transform"
                title={`Source: ${table.name}.${col.name}`}
              />
            </div>
          ))
        )}
      </div>

      {/* Add Column Expandable Form */}
      {isAddingCol ? (
        <div className="border-t border-slate-800 bg-slate-950/60 p-2.5 space-y-2 rounded-b-xl">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="col_name"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="flex-1 rounded bg-slate-900 px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="type"
              value={newColType}
              onChange={(e) => setNewColType(e.target.value)}
              className="w-24 rounded bg-slate-900 px-2 py-1 text-xs text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newColPk}
                onChange={(e) => setNewColPk(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Primary Key</span>
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setIsAddingCol(false)}
                className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                className="rounded bg-indigo-600 px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-indigo-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-800/60 p-1.5 rounded-b-xl">
          <button
            onClick={() => setIsAddingCol(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Column</span>
          </button>
        </div>
      )}
    </div>
  );
};
