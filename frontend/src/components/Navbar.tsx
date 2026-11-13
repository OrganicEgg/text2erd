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
  faCode,
  faDiagramProject,
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
  mobilePane?: 'editor' | 'canvas';
  onChangeMobilePane?: (pane: 'editor' | 'canvas') => void;
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
  mobilePane = 'canvas',
  onChangeMobilePane,
}) => {
  return (
    <header className="flex flex-col border-b border-slate-200 bg-white/95 backdrop-blur-md z-20 shadow-xs shrink-0">
      <div className="flex h-13 sm:h-14 items-center justify-between px-2.5 sm:px-4 gap-2">
        {/* Brand & Left Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Back to Landing Page"
            >
              <FontAwesomeIcon icon={faHouse} className="text-slate-500 text-xs" />
              <span className="hidden lg:inline">Landing</span>
            </button>
          )}

          <button
            onClick={onToggleEditor}
            className="hidden md:inline-flex rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title={isEditorOpen ? 'Hide Editor Panel' : 'Show Editor Panel'}
          >
            <FontAwesomeIcon icon={faColumns} className="text-sm" />
          </button>

          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2 cursor-pointer group truncate"
            title="Text2ERD Home"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm group-hover:bg-green-700 transition-colors shrink-0">
              <FontAwesomeIcon icon={faDatabase} className="text-xs sm:text-sm" />
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 group-hover:text-green-700 transition-colors truncate">
              Text2ERD
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-3 shrink-0">
            <span className="font-medium text-slate-700">{tableCount}</span>
            <span>tables</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{relCount}</span>
            <span>relations</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onAddTable}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Add Table"
          >
            <FontAwesomeIcon icon={faPlus} className="text-green-600 text-xs" />
            <span className="hidden sm:inline">Add Table</span>
          </button>

          <button
            onClick={onAutoLayout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Auto arrange nodes using Dagre"
          >
            <FontAwesomeIcon icon={faTableCells} className="text-slate-500 text-xs" />
            <span className="hidden sm:inline">Auto Layout</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            title="Import SQL DDL"
          >
            <FontAwesomeIcon icon={faFileImport} className="text-green-600 text-xs" />
            <span>Import SQL</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer"
            title="Export SQL DDL"
          >
            <FontAwesomeIcon icon={faFileExport} className="text-xs" />
            <span>Export SQL</span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Segmented Switcher (Editor vs Canvas) */}
      {onChangeMobilePane && (
        <div className="flex md:hidden border-t border-slate-200 bg-slate-100/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeMobilePane('editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mobilePane === 'editor'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
            }`}
          >
            <FontAwesomeIcon icon={faCode} className="text-[11px]" />
            <span>Draft Editor</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMobilePane('canvas')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mobilePane === 'canvas'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
            }`}
          >
            <FontAwesomeIcon icon={faDiagramProject} className="text-[11px]" />
            <span>Diagram Canvas</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                mobilePane === 'canvas'
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tableCount}
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
