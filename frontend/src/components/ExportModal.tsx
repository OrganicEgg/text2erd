import React, { useState, useEffect, useMemo } from 'react';
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import type { Table, Relationship, TableNodeData } from '../types/erd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faCopy,
  faCheck,
  faDownload,
  faXmark,
  faImage,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  generateSqlDdlClient,
  generateMermaidErDiagram,
  generatePrismaSchema,
  generateDbmlSchema,
} from '../utils/clientParser';
import {
  generateCanvasImageDataUrl,
  triggerDataUrlDownload,
} from '../utils/imageExport';
import type { ImageBackgroundOption } from '../utils/imageExport';

export type ExportFormat =
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'prisma'
  | 'dbml'
  | 'mermaid'
  | 'png'
  | 'svg';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  relationships: Relationship[];
  nodes?: Node<TableNodeData>[];
  rfInstance?: ReactFlowInstance<Node<TableNodeData>, Edge> | null;
  initialFormat?: ExportFormat;
}

const CODE_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'prisma', label: 'Prisma' },
  { id: 'dbml', label: 'DBML' },
  { id: 'mermaid', label: 'Mermaid ERD' },
];

const IMAGE_FORMATS: { id: 'png' | 'svg'; label: string }[] = [
  { id: 'png', label: 'PNG Image' },
  { id: 'svg', label: 'SVG Vector' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tables,
  relationships,
  nodes = [],
  rfInstance = null,
  initialFormat = 'postgres',
}) => {
  const [dialect, setDialect] = useState<ExportFormat>(initialFormat);
  const [prevOpen, setPrevOpen] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image export options & state
  const [imageBg, setImageBg] = useState<ImageBackgroundOption>('light');
  const [imageScale, setImageScale] = useState<2 | 3>(2);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setDialect(initialFormat);
    }
  }

  const isSqlDialect = dialect === 'postgres' || dialect === 'mysql' || dialect === 'sqlite';
  const isImageDialect = dialect === 'png' || dialect === 'svg';

  // Instant client-side generation for Prisma, DBML, and Mermaid
  const instantTextContent = useMemo(() => {
    if (!isOpen) return '';
    if (dialect === 'prisma') return generatePrismaSchema(tables, relationships);
    if (dialect === 'dbml') return generateDbmlSchema(tables, relationships);
    if (dialect === 'mermaid') return generateMermaidErDiagram(tables, relationships);
    return '';
  }, [isOpen, dialect, tables, relationships]);

  // SQL generation via backend with client fallback
  useEffect(() => {
    if (!isOpen || !isSqlDialect) return;
    let cancelled = false;

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
          if (!cancelled) {
            setSqlContent(data.sql);
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Backend export unavailable, using client fallback', err);
      }
      if (!cancelled) {
        const clientSql = generateSqlDdlClient(tables, relationships, dialect);
        setSqlContent(clientSql);
        setLoading(false);
      }
    };

    fetchSql();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isSqlDialect, dialect, tables, relationships]);

  // High-res PNG / SVG canvas snapshot generation
  useEffect(() => {
    if (!isOpen || !isImageDialect) return;
    let cancelled = false;

    const renderSnapshot = async () => {
      if (tables.length === 0) {
        setImageDataUrl(null);
        setImageError('Add at least one table to export a diagram image.');
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      setImageError(null);
      try {
        const dataUrl = await generateCanvasImageDataUrl({
          format: dialect,
          background: imageBg,
          pixelRatio: dialect === 'png' ? imageScale : 1,
          rfInstance,
          nodes,
        });
        if (!cancelled) {
          setImageDataUrl(dataUrl);
          setImageLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setImageDataUrl(null);
          setImageError(
            err instanceof Error ? err.message : 'Could not capture diagram snapshot.'
          );
          setImageLoading(false);
        }
      }
    };

    renderSnapshot();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isImageDialect, dialect, imageBg, imageScale, rfInstance, nodes, tables.length]);

  if (!isOpen) return null;

  const activeTextContent = isSqlDialect ? sqlContent : instantTextContent;

  const getCopyLabel = (): string => {
    if (copied) return 'Copied!';
    switch (dialect) {
      case 'mermaid':
        return 'Copy Markdown';
      case 'prisma':
        return 'Copy Prisma';
      case 'dbml':
        return 'Copy DBML';
      case 'png':
        return 'Copy PNG';
      case 'svg':
        return 'Copy SVG';
      default:
        return 'Copy SQL';
    }
  };

  const getDownloadExtension = (): string => {
    switch (dialect) {
      case 'mermaid':
        return '.mmd';
      case 'prisma':
        return '.prisma';
      case 'dbml':
        return '.dbml';
      case 'png':
        return '.png';
      case 'svg':
        return '.svg';
      default:
        return '.sql';
    }
  };

  const getDownloadFilename = (): string => {
    switch (dialect) {
      case 'mermaid':
        return 'diagram_mermaid.mmd';
      case 'prisma':
        return 'schema.prisma';
      case 'dbml':
        return 'schema.dbml';
      case 'png':
        return 'text2erd_diagram.png';
      case 'svg':
        return 'text2erd_diagram.svg';
      default:
        return `schema_${dialect}.sql`;
    }
  };

  const handleCopy = async () => {
    try {
      if (isImageDialect) {
        if (!imageDataUrl) return;
        if (dialect === 'svg') {
          const commaIdx = imageDataUrl.indexOf(',');
          const rawPart = commaIdx >= 0 ? imageDataUrl.slice(commaIdx + 1) : '';
          const svgText = imageDataUrl.includes(';base64,')
            ? atob(rawPart)
            : decodeURIComponent(rawPart);
          await navigator.clipboard.writeText(svgText);
        } else if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
          const resp = await fetch(imageDataUrl);
          const blob = await resp.blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } else {
          await navigator.clipboard.writeText(imageDataUrl);
        }
      } else {
        await navigator.clipboard.writeText(activeTextContent);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleDownload = () => {
    const filename = getDownloadFilename();
    if (isImageDialect) {
      if (!imageDataUrl) return;
      triggerDataUrlDownload(imageDataUrl, filename);
      return;
    }

    const blob = new Blob([activeTextContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <FontAwesomeIcon
                icon={isImageDialect ? faImage : faDatabase}
                className="text-sm"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Export Schema &amp; Diagrams
              </h3>
              <p className="text-xs text-slate-500">
                Export SQL DDL, Prisma, DBML, Mermaid, or high-resolution PNG/SVG snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
            title="Close export modal"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Format & Action Switcher */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-600 mr-1">Schema:</span>
              {CODE_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setDialect(fmt.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    dialect === fmt.id
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

              <span className="text-xs font-medium text-slate-600 mr-0.5">Image:</span>
              {IMAGE_FORMATS.map((imgFmt) => (
                <button
                  key={imgFmt.id}
                  onClick={() => setDialect(imgFmt.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    dialect === imgFmt.id
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FontAwesomeIcon icon={faImage} className="text-[10px]" />
                  <span>{imgFmt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={isImageDialect && (!imageDataUrl || imageLoading)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                <FontAwesomeIcon
                  icon={copied ? faCheck : faCopy}
                  className={copied ? 'text-green-600 text-xs' : 'text-slate-500 text-xs'}
                />
                <span>{getCopyLabel()}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={isImageDialect && (!imageDataUrl || imageLoading)}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
                <span>Download {getDownloadExtension()}</span>
              </button>
            </div>
          </div>

          {/* Image Options Sub-Toolbar */}
          {isImageDialect && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Background:</span>
                {(
                  [
                    { id: 'light', label: 'Studio Slate' },
                    { id: 'white', label: 'Clean White' },
                    { id: 'transparent', label: 'Transparent' },
                  ] as const
                ).map((bgOpt) => (
                  <button
                    key={bgOpt.id}
                    type="button"
                    onClick={() => setImageBg(bgOpt.id)}
                    className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      imageBg === bgOpt.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {bgOpt.label}
                  </button>
                ))}
              </div>

              {dialect === 'png' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Resolution:</span>
                  {([2, 3] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setImageScale(scale)}
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        imageScale === scale
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {scale === 2 ? '2x High-Res' : '3x Ultra HD'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {isImageDialect ? (
            imageLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Rendering {dialect.toUpperCase()} diagram snapshot...
              </div>
            ) : imageError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-center text-xs text-rose-700">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-base text-rose-500" />
                <span>{imageError}</span>
              </div>
            ) : imageDataUrl ? (
              <div
                className={`flex min-h-64 items-center justify-center rounded-xl border border-slate-200 p-4 shadow-2xs overflow-auto ${
                  imageBg === 'transparent'
                    ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-white'
                    : 'bg-white'
                }`}
              >
                <img
                  src={imageDataUrl}
                  alt={`Exported ERD (${dialect.toUpperCase()})`}
                  className="max-h-[46vh] w-auto rounded-lg border border-slate-200/70 shadow-sm object-contain"
                />
              </div>
            ) : null
          ) : loading && isSqlDialect ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              Generating SQL...
            </div>
          ) : (
            <pre className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 overflow-x-auto shadow-2xs leading-relaxed">
              <code>{activeTextContent}</code>
            </pre>
          )}
        </div>

        {/* Bottom Utility Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-white px-6 py-3 text-xs gap-3 rounded-b-2xl">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-medium text-slate-600">Deploy Schema:</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
            >
              Supabase ↗
            </a>
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
            >
              Neon ↗
            </a>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>100% Free &amp; Open Source</span>
          </div>
        </div>
      </div>
    </div>
  );
};
