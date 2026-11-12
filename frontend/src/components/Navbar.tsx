import React from 'react';
import { Database, Plus, LayoutGrid, Upload, Download, PanelLeftClose, PanelLeft } from 'lucide-react';

interface NavbarProps {
  onAddTable: () => void;
  onAutoLayout: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
  tableCount: number;
  relCount: number;
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
}) => {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleEditor}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          title={isEditorOpen ? 'Collapse Editor' : 'Expand Editor'}
        >
          {isEditorOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-600/30">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">
              Text2ERD
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
          <span>{tableCount} tables</span>
          <span>•</span>
          <span>{relCount} relations</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddTable}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Add Table</span>
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          title="Auto arrange nodes"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span>Import SQL</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export SQL</span>
        </button>
      </div>
    </header>
  );
};
