import React, { useState, useEffect } from 'react';
import type { Table, Relationship } from '../types/erd';
import { X, Copy, Check, Download, Database } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Export SQL Schema</h3>
              <p className="text-xs text-slate-400">Select dialect and download or copy DDL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dialect Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Dialect:</span>
            {(['postgres', 'mysql', 'sqlite'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  dialect === d
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {d === 'postgres' ? 'PostgreSQL' : d === 'mysql' ? 'MySQL' : 'SQLite'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* SQL Preview Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Generating SQL...
            </div>
          ) : (
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto selection:bg-indigo-500/30">
              <code>{sqlContent}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
