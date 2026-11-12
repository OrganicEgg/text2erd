import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faPlus,
  faTableCells,
  faFileImport,
  faFileExport,
  faHouse,
  faColumns,
} from '@fortawesome/free-solid-svg-icons';

interface NavbarProps {
  onAddTable: () => void;
  onAutoLayout: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
  tableCount: number;
  relCount: number;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddTable,
  onAutoLayout,
  onOpenImport,
  onOpenExport,
  isEditorOpen,
  onToggleEditor,
  tableCount,
  relCount,
  onNavigateHome,
}) => {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md z-20 shadow-xs">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Landing Page"
          >
            <FontAwesomeIcon icon={faHouse} className="text-slate-500 text-xs" />
            <span className="hidden sm:inline">Landing</span>
          </button>
        )}

        <button
          onClick={onToggleEditor}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          title={isEditorOpen ? 'Hide Editor Panel' : 'Show Editor Panel'}
        >
          <FontAwesomeIcon icon={faColumns} className="text-sm" />
        </button>

        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Text2ERD Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm group-hover:bg-green-700 transition-colors">
            <FontAwesomeIcon icon={faDatabase} className="text-sm" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-green-700 transition-colors">
            Text2ERD
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-3">
          <span className="font-medium text-slate-700">{tableCount}</span>
          <span>tables</span>
          <span>•</span>
          <span className="font-medium text-slate-700">{relCount}</span>
          <span>relations</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddTable}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
        >
          <FontAwesomeIcon icon={faPlus} className="text-green-600 text-xs" />
          <span className="hidden sm:inline">Add Table</span>
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          title="Auto arrange nodes using Dagre"
        >
          <FontAwesomeIcon icon={faTableCells} className="text-slate-500 text-xs" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
        >
          <FontAwesomeIcon icon={faFileImport} className="text-green-600 text-xs" />
          <span>Import SQL</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faFileExport} className="text-xs" />
          <span>Export SQL</span>
        </button>
      </div>
    </header>
  );
};
