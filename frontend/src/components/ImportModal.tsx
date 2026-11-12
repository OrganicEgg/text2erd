import React, { useState } from 'react';
import type { DiagramData } from '../types/erd';
import { X, Upload, FileCode, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: DiagramData) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [sqlInput, setSqlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!sqlInput.trim()) {
      setError('Please paste SQL DDL statements.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/import-sql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlInput }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to parse SQL');
      }

      const data: DiagramData = await resp.json();
      if (!data.tables || data.tables.length === 0) {
        throw new Error('No valid CREATE TABLE statements found.');
      }

      onImportSuccess(data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Import SQL DDL</h3>
              <p className="text-xs text-slate-400">Paste standard CREATE TABLE statements to visualize</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>SQL Statements</span>
              <button
                type="button"
                onClick={() =>
                  setSqlInput(`CREATE TABLE authors (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE articles (
    id INT PRIMARY KEY,
    author_id INT,
    title VARCHAR(200) NOT NULL,
    FOREIGN KEY (author_id) REFERENCES authors(id)
);`)
                }
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <FileCode className="h-3 w-3" />
                <span>Load Sample SQL</span>
              </button>
            </label>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="CREATE TABLE users (&#10;    id INT PRIMARY KEY,&#10;    email VARCHAR(255) UNIQUE&#10;);"
              rows={12}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/40 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-900/30"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{loading ? 'Importing...' : 'Import to Canvas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
