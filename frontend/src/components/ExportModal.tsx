import React, { useState, useEffect } from 'react';
import type { Table, Relationship } from '../types/erd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faCopy,
  faCheck,
  faDownload,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { generateSqlDdlClient } from '../utils/clientParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  relationships: Relationship[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tables,
  relationships,
}) => {
  const [dialect, setDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');
  const [sqlContent, setSqlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSql = async () => {
      setLoading(true);
      try {
        const resp = await fetch('/api/export-sql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tables, relationships, dialect }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setSqlContent(data.sql);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend export unavailable, using client fallback', err);
      }
      // Client-side SQL generation fallback for Vercel/serverless
      const clientSql = generateSqlDdlClient(tables, relationships, dialect);
      setSqlContent(clientSql);
      setLoading(false);
    };

    fetchSql();
  }, [isOpen, dialect, tables, relationships]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema_${dialect}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <FontAwesomeIcon icon={faDatabase} className="text-sm" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Export SQL Schema</h3>
              <p className="text-xs text-slate-500">Select dialect and download or copy DDL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Dialect Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Dialect:</span>
            {(['postgres', 'mysql', 'sqlite'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  dialect === d
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {d === 'postgres' ? 'PostgreSQL' : d === 'mysql' ? 'MySQL' : 'SQLite'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
            >
              <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                className={copied ? 'text-green-600 text-xs' : 'text-slate-500 text-xs'}
              />
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors cursor-pointer shadow-xs"
            >
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* SQL Preview Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              Generating SQL...
            </div>
          ) : (
            <pre className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 overflow-x-auto shadow-2xs leading-relaxed">
              <code>{sqlContent}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
