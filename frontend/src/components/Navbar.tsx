import React from 'react';
import { Database, Plus, LayoutGrid, Upload, Download, PanelLeftClose, PanelLeft, Home } from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

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
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md z-20">
      {/* Brand & Left Controls */}
      <div className="flex items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to Landing Page"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </button>
        )}

        <button
          onClick={onToggleEditor}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          title={isEditorOpen ? 'Collapse Editor' : 'Expand Editor'}
        >
          {isEditorOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>

        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Database className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            Text2ERD
          </span>
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
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Add Table</span>
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          title="Auto arrange nodes"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span>Import SQL</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export SQL</span>
        </button>

        <a
          href="https://github.com/OrganicEgg/text2erd"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          title="GitHub Repo"
        >
          <GithubIcon className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
};
