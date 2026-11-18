import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import { TableNode } from './components/TableNode';
import { Navbar } from './components/Navbar';
import { NotepadEditor } from './components/NotepadEditor';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { LandingPage } from './components/LandingPage';
import type { Table, Relationship, DiagramData, TableNodeData } from './types/erd';
import { getLayoutedElements } from './utils/layout';
import { TEMPLATES } from './utils/templates';
import {
  parseDraftTextClient,
  encodeDraftToHash,
  decodeDraftFromHash,
} from './utils/clientParser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';

const DEFAULT_DRAFT = TEMPLATES[0].draft;
const STORAGE_KEY = 'text2erd_saved_draft_v1';
const MAX_TABLES_LIMIT = 150;

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() => {
    if (typeof window !== 'undefined' && (window.location.hash.startsWith('#draft=') || window.location.hash === '#app')) {
      return 'app';
    }
    return 'landing';
  });
  const [draftText, setDraftText] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#draft=')) {
        const decoded = decodeDraftFromHash(window.location.hash.slice(7));
        if (decoded && decoded.trim()) return decoded;
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && saved.trim() ? saved : DEFAULT_DRAFT;
    } catch {
      return DEFAULT_DRAFT;
    }
  });
  const [tables, setTables] = useState<Table[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = useCallback(() => {
    try {
      const hash = encodeDraftToHash(draftText);
      const url = `${window.location.origin}${window.location.pathname}#draft=${hash}`;
      window.history.replaceState(null, '', `#draft=${hash}`);
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  }, [draftText]);

  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [mobilePane, setMobilePane] = useState<'editor' | 'canvas'>('canvas');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({ tableNode: TableNode }), []);

  // Sync canvas lock state to all nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isLocked: isCanvasLocked,
        },
      }))
    );
  }, [isCanvasLocked, setNodes]);

  // Persist draft in localStorage (ephemeral client-only convenience)
  useEffect(() => {
    try {
      if (draftText.trim()) {
        localStorage.setItem(STORAGE_KEY, draftText);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [draftText]);

  // Update a single table from canvas interactions (rename, add col, delete col)
  const handleUpdateTable = useCallback((tableId: string, updatedTable: Table) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId || t.name === tableId ? updatedTable : t))
    );
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === tableId) {
          return {
            ...node,
            data: {
              ...node.data,
              table: updatedTable,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Delete a table from canvas
  const handleDeleteTable = useCallback((tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId && t.name !== tableId));
    setRelationships((prev) =>
      prev.filter((r) => r.source_table !== tableId && r.target_table !== tableId)
    );
    setNodes((nds) => nds.filter((node) => node.id !== tableId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== tableId && edge.target !== tableId)
    );
  }, [setNodes, setEdges]);

  // Build React Flow nodes and edges from DiagramData
  const buildGraphElements = useCallback(
    (diagramTables: Table[], diagramRels: Relationship[]) => {
      const flowNodes: Node<TableNodeData>[] = diagramTables.map((tbl, idx) => ({
        id: tbl.id || tbl.name,
        type: 'tableNode',
        position: { x: (idx % 3) * 320, y: Math.floor(idx / 3) * 350 },
        data: {
          table: tbl,
          onUpdateTable: handleUpdateTable,
          onDeleteTable: handleDeleteTable,
          isLocked: isCanvasLocked,
        },
      }));

      const flowEdges: Edge[] = diagramRels.map((rel) => {
        const sourceCol = rel.source_column;
        const targetCol = rel.target_column;
        return {
          id: rel.id || `rel_${rel.source_table}_${sourceCol}_${rel.target_table}_${targetCol}`,
          source: rel.source_table,
          target: rel.target_table,
          sourceHandle: `${sourceCol}-source`,
          targetHandle: `${targetCol}-target`,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#16a34a', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#16a34a',
          },
          label: `${rel.source_table}.${sourceCol} ➔ ${rel.target_table}.${targetCol}`,
          labelStyle: { fill: '#166534', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        };
      });

      return getLayoutedElements(flowNodes, flowEdges);
    },
    [handleUpdateTable, handleDeleteTable]
  );

  // Apply diagram data to state and canvas
  const applyDiagramData = useCallback(
    (data: DiagramData) => {
      setTables(data.tables);
      setRelationships(data.relationships);
      const { nodes: layoutedNodes, edges: layoutedEdges } = buildGraphElements(
        data.tables,
        data.relationships
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [buildGraphElements, setNodes, setEdges]
  );

  // Run Draft: send to /api/parse-draft/ with client fallback
  const handleRunDraft = useCallback(
    async (textOverride?: string, switchToCanvasOnMobile = false) => {
      const textToParse = textOverride ?? draftText;
      if (!textToParse.trim()) return;
      setLoading(true);
      setDraftError(null);
      try {
        const resp = await fetch('/api/parse-draft/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToParse }),
        });
        if (resp.status === 413) {
          const errData = await resp.json().catch(() => ({}));
          setDraftError(errData.error || 'Draft exceeds maximum allowed size or table limit.');
          setLoading(false);
          return;
        }
        if (resp.status === 429) {
          setDraftError('Too many requests. Please wait a moment and try again.');
          setLoading(false);
          return;
        }
        if (resp.ok) {
          const data: DiagramData = await resp.json();
          if (data.tables.length > MAX_TABLES_LIMIT) {
            setDraftError(`Schema exceeds the ${MAX_TABLES_LIMIT}-table limit (${data.tables.length} found).`);
            setLoading(false);
            return;
          }
          applyDiagramData(data);
          if (switchToCanvasOnMobile) {
            setMobilePane('canvas');
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, falling back to client parser', err);
      }
      // Fallback: client-side parser for Vercel / serverless deployments
      try {
        const clientData = parseDraftTextClient(textToParse);
        if (clientData.tables.length > MAX_TABLES_LIMIT) {
          setDraftError(`Schema exceeds the ${MAX_TABLES_LIMIT}-table limit (${clientData.tables.length} found).`);
          return;
        }
        applyDiagramData(clientData);
        if (switchToCanvasOnMobile) {
          setMobilePane('canvas');
        }
      } catch (parseErr) {
        console.error('Failed to parse draft client-side', parseErr);
        setDraftError('Could not parse draft text. Please check syntax.');
      } finally {
        setLoading(false);
      }
    },
    [draftText, applyDiagramData]
  );

  // Initial load: parse default template
  useEffect(() => {
    handleRunDraft();
  }, []);

  // Handle Launch App from Landing Page
  const handleLaunchApp = useCallback(
    (initialDraft?: string) => {
      if (initialDraft && initialDraft !== draftText) {
        setDraftText(initialDraft);
        handleRunDraft(initialDraft);
      }
      setCurrentView('app');
      window.location.hash = '#app';
    },
    [draftText, handleRunDraft]
  );

  const handleNavigateHome = useCallback(() => {
    setCurrentView('landing');
    window.location.hash = '';
  }, []);

  // Connection created by dragging handle to handle
  const onConnect = useCallback(
    (connection: Connection) => {
      if (isCanvasLocked || !connection.source || !connection.target) return;

      const sourceCol = connection.sourceHandle?.replace('-source', '') || '';
      const targetCol = connection.targetHandle?.replace('-target', '') || '';

      const newRel: Relationship = {
        id: `rel_${connection.source}_${sourceCol}_${connection.target}_${targetCol}`,
        source_table: connection.source,
        source_column: sourceCol,
        target_table: connection.target,
        target_column: targetCol,
        type: 'one_to_many',
      };

      setRelationships((prev) => [...prev, newRel]);

      const newEdge: Edge = {
        ...connection,
        id: newRel.id,
        source: connection.source,
        target: connection.target,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#16a34a', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: '#16a34a',
        },
        label: `${connection.source}.${sourceCol} ➔ ${connection.target}.${targetCol}`,
        labelStyle: { fill: '#166534', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isCanvasLocked, setEdges]
  );

  // Add Table directly from canvas
  const handleAddTable = useCallback(() => {
    if (isCanvasLocked) return;

    const tableNum = tables.length + 1;
    const newTableName = `table_${tableNum}`;
    const newTbl: Table = {
      id: newTableName,
      name: newTableName,
      columns: [
        { name: 'id', type: 'int', is_pk: true, is_nullable: false, is_unique: false },
      ],
    };

    setTables((prev) => [...prev, newTbl]);

    const newNode: Node<TableNodeData> = {
      id: newTableName,
      type: 'tableNode',
      position: { x: 100 + (tables.length % 4) * 80, y: 100 + (tables.length % 4) * 80 },
      data: {
        table: newTbl,
        onUpdateTable: handleUpdateTable,
        onDeleteTable: handleDeleteTable,
        isLocked: isCanvasLocked,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setMobilePane('canvas');
  }, [isCanvasLocked, tables, handleUpdateTable, handleDeleteTable, setNodes]);

  // Auto-Layout trigger
  const handleAutoLayout = useCallback(() => {
    if (isCanvasLocked) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setMobilePane('canvas');
  }, [isCanvasLocked, nodes, edges, setNodes, setEdges]);

  // Reset to empty
  const handleReset = useCallback(() => {
    setDraftText('');
    setDraftError(null);
    setTables([]);
    setRelationships([]);
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Import SQL Success callback
  const handleImportSuccess = useCallback(
    (data: DiagramData) => {
      applyDiagramData(data);
      // Recreate draft text representation
      const lines: string[] = [];
      data.tables.forEach((t) => {
        lines.push(t.name);
        t.columns.forEach((c) => {
          let line = `  ${c.name} ${c.type}`;
          if (c.is_pk) line += ' pk';
          if (c.is_unique) line += ' unique';
          if (!c.is_nullable && !c.is_pk) line += ' not null';

          // find if relation exists from this column
          const rel = data.relationships.find(
            (r) => r.source_table === t.name && r.source_column === c.name
          );
          if (rel) {
            line += ` -> ${rel.target_table}.${rel.target_column}`;
          }
          lines.push(line);
        });
        lines.push('');
      });
      setDraftText(lines.join('\n'));
      setMobilePane('canvas');
    },
    [applyDiagramData]
  );

  // If in landing mode, show promotional LandingPage
  if (currentView === 'landing') {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  // Otherwise, render full Studio Visualizer
  return (
    <div className="flex h-dvh w-screen flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Navbar */}
      <Navbar
        onAddTable={handleAddTable}
        onAutoLayout={handleAutoLayout}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onShare={handleShare}
        shareCopied={shareCopied}
        isLocked={isCanvasLocked}
        onToggleLock={() => setIsCanvasLocked((prev) => !prev)}
        isEditorOpen={isEditorOpen}
        onToggleEditor={() => setIsEditorOpen(!isEditorOpen)}
        tableCount={tables.length}
        relCount={relationships.length}
        onNavigateHome={handleNavigateHome}
        mobilePane={mobilePane}
        onChangeMobilePane={setMobilePane}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Pane: Notepad / Draft Editor */}
        <div
          className={`${
            mobilePane === 'editor' ? 'flex w-full' : 'hidden'
          } ${
            isEditorOpen ? 'md:flex md:w-80 lg:w-96' : 'md:hidden'
          } shrink-0 h-full z-10 transition-all duration-300`}
        >
          <NotepadEditor
            draftText={draftText}
            onChangeDraft={(val) => {
              setDraftText(val);
              if (draftError) setDraftError(null);
            }}
            onRunDraft={() => handleRunDraft(undefined, true)}
            onReset={handleReset}
            loading={loading}
            error={draftError}
          />
        </div>

        {/* Right Pane: React Flow Canvas */}
        <div
          className={`${
            mobilePane === 'canvas' ? 'flex' : 'hidden md:flex'
          } flex-1 h-full relative bg-slate-100/70`}
        >
          {/* Floating Canvas Locked Alert Banner */}
          {isCanvasLocked && (
            <div
              role="alert"
              aria-live="polite"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-full bg-slate-900/90 text-slate-100 border border-amber-500/50 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400">
                <FontAwesomeIcon icon={faLock} className="text-xs text-amber-400" />
              </div>
              <div className="text-xs font-medium tracking-wide">
                <span className="font-semibold text-amber-300">Canvas Locked</span>
                <span className="text-slate-300 hidden sm:inline"> — Visualizer is frozen (pan & zoom active)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCanvasLocked(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm cursor-pointer ml-1"
                title="Unlock canvas to resume editing"
              >
                <FontAwesomeIcon icon={faLockOpen} className="text-[10px]" />
                <span>Unlock</span>
              </button>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isCanvasLocked ? undefined : onNodesChange}
            onEdgesChange={isCanvasLocked ? undefined : onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.15}
            maxZoom={2.5}
            nodesDraggable={!isCanvasLocked}
            nodesConnectable={!isCanvasLocked}
            elementsSelectable={!isCanvasLocked}
            nodesFocusable={!isCanvasLocked}
            edgesFocusable={!isCanvasLocked}
            deleteKeyCode={isCanvasLocked ? null : ['Backspace', 'Delete']}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#16a34a', strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="#cbd5e1"
            />
            <Controls className="!bg-white !border-slate-200 !rounded-xl !shadow-md !overflow-hidden [&>button]:!bg-white [&>button]:!border-slate-200 [&>button]:!text-slate-600 [&>button:hover]:!bg-slate-100" />
            <MiniMap
              nodeColor="#16a34a"
              maskColor="rgba(241, 245, 249, 0.7)"
              className="hidden sm:block !bg-white/90 !border-slate-200 !rounded-xl !shadow-md"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tables={tables}
        relationships={relationships}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default App;
