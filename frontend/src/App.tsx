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

const DEFAULT_DRAFT = TEMPLATES[0].draft;

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>(() =>
    window.location.hash === '#app' ? 'app' : 'landing'
  );
  const [draftText, setDraftText] = useState(DEFAULT_DRAFT);
  const [tables, setTables] = useState<Table[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({ tableNode: TableNode }), []);

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
          style: { stroke: '#38bdf8', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#38bdf8',
          },
          label: `${rel.source_table}.${sourceCol} ➔ ${rel.target_table}.${targetCol}`,
          labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
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

  // Run Draft: send to /api/parse-draft/
  const handleRunDraft = useCallback(
    async (textOverride?: string) => {
      const textToParse = textOverride ?? draftText;
      if (!textToParse.trim()) return;
      setLoading(true);
      try {
        const resp = await fetch('/api/parse-draft/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToParse }),
        });
        if (resp.ok) {
          const data: DiagramData = await resp.json();
          applyDiagramData(data);
        } else {
          alert('Could not parse draft text. Please check syntax.');
        }
      } catch (err) {
        console.error(err);
        alert('Network error connecting to backend.');
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
      if (!connection.source || !connection.target) return;

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
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: '#38bdf8',
        },
        label: `${connection.source}.${sourceCol} ➔ ${connection.target}.${targetCol}`,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add Table directly from canvas
  const handleAddTable = useCallback(() => {
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
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [tables, handleUpdateTable, handleDeleteTable, setNodes]);

  // Auto-Layout trigger
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  // Reset to empty
  const handleReset = useCallback(() => {
    setDraftText('');
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
    },
    [applyDiagramData]
  );

  // If in landing mode, show promotional LandingPage
  if (currentView === 'landing') {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  // Otherwise, render full Studio Visualizer
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Navbar */}
      <Navbar
        onAddTable={handleAddTable}
        onAutoLayout={handleAutoLayout}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        isEditorOpen={isEditorOpen}
        onToggleEditor={() => setIsEditorOpen(!isEditorOpen)}
        tableCount={tables.length}
        relCount={relationships.length}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Pane: Notepad / Draft Editor */}
        {isEditorOpen && (
          <div className="w-80 md:w-96 shrink-0 h-full z-10 transition-all duration-300">
            <NotepadEditor
              draftText={draftText}
              onChangeDraft={setDraftText}
              onRunDraft={() => handleRunDraft()}
              onReset={handleReset}
              loading={loading}
            />
          </div>
        )}

        {/* Right Pane: React Flow Canvas */}
        <div className="flex-1 h-full relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#38bdf8', strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="#334155"
            />
            <Controls className="!bg-slate-900 !border-slate-800 !rounded-xl !shadow-xl !overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800" />
            <MiniMap
              nodeColor="#3b82f6"
              maskColor="rgba(15, 23, 42, 0.7)"
              className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-xl"
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
