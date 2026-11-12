import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { TableNodeData } from '../types/erd';

const NODE_WIDTH = 250;
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 50;

export function getLayoutedElements(
  nodes: Node<TableNodeData>[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    align: 'DL',
  });

  nodes.forEach((node) => {
    const colCount = node.data.table.columns.length;
    const height = HEADER_HEIGHT + colCount * ROW_HEIGHT + 24;
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const colCount = node.data.table.columns.length;
    const height = HEADER_HEIGHT + colCount * ROW_HEIGHT + 24;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
