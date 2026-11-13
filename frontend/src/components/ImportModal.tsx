import React, { useState, useRef } from 'react';
import type { DiagramData } from '../types/erd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileImport,
  faXmark,
  faFileLines,
  faCircleExclamation,
  faCloudArrowUp,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { parseSqlDdlClient } from '../utils/clientParser';

export const MAX_IMPORT_BYTES = 500 * 1024; // 500 KB limit
export const MAX_TABLES_LIMIT = 150;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

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
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentByteSize = new Blob([sqlInput]).size;
  const isOverSizeLimit = currentByteSize > MAX_IMPORT_BYTES;

  const processFile = (file: File) => {
    setError(null);

    const validExts = ['.sql', '.txt', '.ddl'];
    const lowerName = file.name.toLowerCase();
    if (!validExts.some((ext) => lowerName.endsWith(ext))) {
      setError('Invalid file format. Please upload a .sql, .ddl, or .txt file.');
      return;
    }

    if (file.size > MAX_IMPORT_BYTES) {
      setError(
        `File "${file.name}" (${formatBytes(file.size)}) exceeds the maximum limit of ${formatBytes(MAX_IMPORT_BYTES)}.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setSqlInput(content);
        setFileName(file.name);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImport = async () => {
    if (!sqlInput.trim()) {
      setError('Please upload a .sql file or paste SQL DDL statements.');
      return;
    }

    if (isOverSizeLimit) {
      setError(
        `SQL input (${formatBytes(currentByteSize)}) exceeds the ${formatBytes(MAX_IMPORT_BYTES)} import limit.`
      );
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

        if (resp.status === 413) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `SQL input exceeds maximum allowed size (${formatBytes(MAX_IMPORT_BYTES)}).`);
        }

        if (resp.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }

        if (resp.ok) {
          const data: DiagramData = await resp.json();
          if (data.tables && data.tables.length > 0) {
            if (data.tables.length > MAX_TABLES_LIMIT) {
              throw new Error(
                `Imported schema has ${data.tables.length} tables, exceeding the ${MAX_TABLES_LIMIT}-table limit.`
              );
            }
            onImportSuccess(data);
            onClose();
            return;
          }
        }
      } catch (backendErr) {
        if (
          backendErr instanceof Error &&
          (backendErr.message.includes('exceeds') || backendErr.message.includes('Too many requests'))
        ) {
          throw backendErr;
        }
        console.warn('Backend import unavailable, using client parser', backendErr);
      }

      // Fallback: client-side SQL parser
      const clientData = parseSqlDdlClient(sqlInput);
      if (!clientData.tables || clientData.tables.length === 0) {
        throw new Error('No valid CREATE TABLE statements detected in the provided SQL.');
      }

      if (clientData.tables.length > MAX_TABLES_LIMIT) {
        throw new Error(
          `Imported schema has ${clientData.tables.length} tables, exceeding the ${MAX_TABLES_LIMIT}-table limit.`
        );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[90vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700 shrink-0">
              <FontAwesomeIcon icon={faFileImport} className="text-sm" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Import SQL DDL</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Upload a <code className="text-slate-700">.sql</code> file or paste <code className="text-slate-700">CREATE TABLE</code> statements (max {formatBytes(MAX_IMPORT_BYTES)})
              </p>
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
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 bg-white">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-rose-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors cursor-pointer ${
              isDragging
                ? 'border-green-500 bg-green-50/70'
                : 'border-slate-300 bg-slate-50/70 hover:border-green-500/60 hover:bg-green-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.ddl,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100/80 text-green-700 shrink-0">
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-xs" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {fileName ? (
                    <span className="text-green-700">Loaded: {fileName}</span>
                  ) : (
                    <>Click to upload or drag &amp; drop a <span className="text-green-700">.sql</span> file</>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports .sql, .ddl, .txt • Max size: {formatBytes(MAX_IMPORT_BYTES)} • Max {MAX_TABLES_LIMIT} tables
                </p>
              </div>
            </div>

            {fileName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFileName(null);
                  setSqlInput('');
                  setError(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-[10px]" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                SQL Statements
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-mono ${
                    isOverSizeLimit
                      ? 'text-rose-600 font-semibold'
                      : currentByteSize > MAX_IMPORT_BYTES * 0.8
                      ? 'text-amber-600 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {formatBytes(currentByteSize)} / {formatBytes(MAX_IMPORT_BYTES)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setError(null);
                    setSqlInput(`CREATE TABLE authors (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE articles (
    id INT PRIMARY KEY,
    author_id INT,
    title VARCHAR(200) NOT NULL,
    FOREIGN KEY (author_id) REFERENCES authors(id)
);`);
                  }}
                  className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faFileLines} className="text-[11px]" />
                  <span>Load Sample SQL</span>
                </button>
              </div>
            </div>
            <textarea
              value={sqlInput}
              onChange={(e) => {
                setSqlInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="CREATE TABLE users (&#10;    id INT PRIMARY KEY,&#10;    email VARCHAR(255) UNIQUE&#10;);"
              rows={10}
              className={`w-full rounded-xl border bg-slate-50/50 p-3.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 leading-relaxed ${
                isOverSizeLimit
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-600'
                  : 'border-slate-200 focus:border-green-600 focus:ring-green-600'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || isOverSizeLimit}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
          >
            <FontAwesomeIcon icon={faFileImport} className="text-xs" />
            <span>{loading ? 'Importing...' : 'Import to Canvas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
