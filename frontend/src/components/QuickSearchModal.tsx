import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Table, TableColorKey } from '../types/erd';
import { TABLE_COLOR_PALETTE, getTableColorTheme } from '../utils/tableColors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faKey,
  faLink,
  faArrowTurnDown,
  faXmark,
  faTable,
} from '@fortawesome/free-solid-svg-icons';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onSelectTable: (tableId: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  tables,
  onSelectTable,
}) => {
  const [query, setQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<TableColorKey | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setColorFilter('all');
      setSelectedIndex(0);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Colors actively used across current tables
  const activeColorCounts = useMemo(() => {
    const counts = new Map<TableColorKey, number>();
    for (const t of tables) {
      const key = getTableColorTheme(t.color).key;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [tables]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tables
      .filter((tbl) => {
        const tblColor = getTableColorTheme(tbl.color).key;
        if (colorFilter !== 'all' && tblColor !== colorFilter) {
          return false;
        }
        if (!q) return true;
        if (tbl.name.toLowerCase().includes(q)) return true;
        return tbl.columns.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q) ||
            (q === 'pk' && c.is_pk) ||
            (q === 'fk' && c.is_fk)
        );
      })
      .map((tbl) => {
        const qLower = query.trim().toLowerCase();
        const matchingCols = qLower
          ? tbl.columns.filter(
              (c) =>
                c.name.toLowerCase().includes(qLower) ||
                c.type.toLowerCase().includes(qLower) ||
                (qLower === 'pk' && c.is_pk) ||
                (qLower === 'fk' && c.is_fk)
            )
          : tbl.columns.slice(0, 4);

        const rank = !qLower
          ? 1
          : tbl.name.toLowerCase() === qLower
          ? 0
          : tbl.name.toLowerCase().startsWith(qLower)
          ? 1
          : tbl.name.toLowerCase().includes(qLower)
          ? 2
          : 3;

        return { table: tbl, matchingCols, rank };
      })
      .sort((a, b) => a.rank - b.rank || a.table.name.localeCompare(b.table.name));
  }, [tables, query, colorFilter]);

  if (!isOpen) return null;

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredResults.length - 1));

  const handleConfirmSelection = (tableId: string) => {
    onSelectTable(tableId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
      return;
    }
    if (e.key === 'Enter' && filteredResults[safeSelectedIndex]) {
      e.preventDefault();
      handleConfirmSelection(filteredResults[safeSelectedIndex].table.id || filteredResults[safeSelectedIndex].table.name);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick Search Tables"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-green-600 text-sm shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tables, columns, or data types (e.g. users, email, uuid)..."
            aria-label="Search tables and columns"
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Color Filter Bar */}
        {tables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-4 py-2">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => {
                setColorFilter('all');
                setSelectedIndex(0);
              }}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                colorFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({tables.length})
            </button>
            {TABLE_COLOR_PALETTE.filter((p) => (activeColorCounts.get(p.key) || 0) > 0).map(
              (palette) => {
                const count = activeColorCounts.get(palette.key) || 0;
                const isActive = colorFilter === palette.key;
                return (
                  <button
                    key={palette.key}
                    type="button"
                    onClick={() => {
                      setColorFilter(isActive ? 'all' : palette.key);
                      setSelectedIndex(0);
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? `${palette.badgeClass} ring-1 ring-current font-semibold`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${palette.swatchClass}`} />
                    <span>{palette.label}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredResults.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {tables.length === 0
                ? 'No tables on canvas yet. Draft or import a schema first.'
                : `No tables or columns matching "${query}"`}
            </div>
          ) : (
            filteredResults.map(({ table, matchingCols }, idx) => {
              const theme = getTableColorTheme(table.color);
              const isSelected = idx === safeSelectedIndex;
              const tblId = table.id || table.name;

              return (
                <button
                  key={tblId}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleConfirmSelection(tblId)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-green-50/90 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${theme.swatchClass}`}
                      />
                      <FontAwesomeIcon
                        icon={faTable}
                        className="text-[11px] text-slate-400 shrink-0"
                      />
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {table.name}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-mono text-slate-500 border border-slate-200/80">
                        {table.columns.length} {table.columns.length === 1 ? 'col' : 'cols'}
                      </span>
                    </div>

                    {matchingCols.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4">
                        {matchingCols.slice(0, 5).map((col) => (
                          <span
                            key={col.name}
                            className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                          >
                            {col.is_pk && (
                              <FontAwesomeIcon
                                icon={faKey}
                                className="h-2 w-2 text-amber-500"
                              />
                            )}
                            {col.is_fk && (
                              <FontAwesomeIcon
                                icon={faLink}
                                className="h-2 w-2 text-emerald-600"
                              />
                            )}
                            <span>{col.name}</span>
                            <span className="text-slate-400">{col.type}</span>
                          </span>
                        ))}
                        {matchingCols.length > 5 && (
                          <span className="text-[10px] text-slate-400">
                            +{matchingCols.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold shrink-0 transition-opacity ${
                      isSelected
                        ? 'bg-green-600 text-white opacity-100'
                        : 'bg-slate-100 text-slate-500 opacity-0'
                    }`}
                  >
                    <span>Focus</span>
                    <FontAwesomeIcon icon={faArrowTurnDown} className="rotate-90 text-[9px]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Focus &amp; Highlight
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {filteredResults.length} of {tables.length} tables
          </span>
        </div>
      </div>
    </div>
  );
};
