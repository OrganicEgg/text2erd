import React, { useState } from 'react';
import type { DiagramData } from '../types/erd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileImport,
  faXmark,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { parseSqlDdlClient } from '../utils/clientParser';

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
      // First try Django backend if available
      try {
        const resp = await fetch('/api/import-sql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: sqlInput }),
        });

        if (resp.ok) {
          const data: DiagramData = await resp.json();
          if (data.tables && data.tables.length > 0) {
            onImportSuccess(data);
            onClose();
            return;
          }
        }
      } catch (backendErr) {
        console.warn('Backend import unavailable, using client parser', backendErr);
      }

      // Fallback: client-side SQL parser
      const clientData = parseSqlDdlClient(sqlInput);
      if (!clientData.tables || clientData.tables.length === 0) {
        throw new Error('No valid CREATE TABLE statements detected in the provided SQL.');
      }

      onImportSuccess(clientData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <FontAwesomeIcon icon={faFileImport} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Import SQL DDL</h3>
              <p className="text-xs text-slate-500">Paste standard CREATE TABLE statements to visualize</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-white">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                SQL Statements
              </label>
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
                className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <FontAwesomeIcon icon={faFileLines} className="text-[11px]" />
                <span>Load Sample SQL</span>
              </button>
            </div>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="CREATE TABLE users (&#10;    id INT PRIMARY KEY,&#10;    email VARCHAR(255) UNIQUE&#10;);"
              rows={12}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-600 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <FontAwesomeIcon icon={faFileImport} className="text-xs" />
            <span>{loading ? 'Importing...' : 'Import to Canvas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
