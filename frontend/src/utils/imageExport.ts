import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node, ReactFlowInstance, Edge } from '@xyflow/react';
import type { TableNodeData } from '../types/erd';

export type ImageExportFormat = 'png' | 'svg';
export type ImageBackgroundOption = 'light' | 'white' | 'transparent';

export interface ExportImageOptions {
  format: ImageExportFormat;
  background?: ImageBackgroundOption;
  pixelRatio?: number;
  rfInstance?: ReactFlowInstance<Node<TableNodeData>, Edge> | null;
  nodes?: Node<TableNodeData>[];
}

const DEFAULT_NODE_WIDTH = 260;
const DEFAULT_HEADER_HEIGHT = 50;
const DEFAULT_ROW_HEIGHT = 32;

function getBackgroundHex(bg: ImageBackgroundOption): string | undefined {
  if (bg === 'transparent') return undefined;
  if (bg === 'white') return '#ffffff';
  return '#f8fafc';
}

export function computeDiagramImageDimensions(
  nodes: Node<TableNodeData>[],
  rfInstance?: ReactFlowInstance<Node<TableNodeData>, Edge> | null
): { width: number; height: number; x: number; y: number; zoom: number } {
  if (!nodes.length) {
    return { width: 800, height: 500, x: 0, y: 0, zoom: 1 };
  }

  let bounds = { x: 0, y: 0, width: 800, height: 500 };

  try {
    if (rfInstance) {
      const rfBounds = rfInstance.getNodesBounds(rfInstance.getNodes());
      if (rfBounds.width > 0 && rfBounds.height > 0) {
        bounds = rfBounds;
      } else {
        throw new Error('Empty measured bounds');
      }
    } else {
      const nodesWithDimensions = nodes.map((n) => ({
        ...n,
        width: n.measured?.width ?? n.width ?? DEFAULT_NODE_WIDTH,
        height:
          n.measured?.height ??
          n.height ??
          DEFAULT_HEADER_HEIGHT + n.data.table.columns.length * DEFAULT_ROW_HEIGHT + 24,
      }));
      bounds = getNodesBounds(nodesWithDimensions);
    }
  } catch {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      const w = n.measured?.width ?? n.width ?? DEFAULT_NODE_WIDTH;
      const h =
        n.measured?.height ??
        n.height ??
        DEFAULT_HEADER_HEIGHT + n.data.table.columns.length * DEFAULT_ROW_HEIGHT + 24;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    }

    bounds = {
      x: Number.isFinite(minX) ? minX : 0,
      y: Number.isFinite(minY) ? minY : 0,
      width: Number.isFinite(maxX - minX) && maxX > minX ? maxX - minX : 800,
      height: Number.isFinite(maxY - minY) && maxY > minY ? maxY - minY : 500,
    };
  }

  const paddingPx = 80;
  const imageWidth = Math.max(800, Math.min(4096, Math.ceil(bounds.width + paddingPx * 2)));
  const imageHeight = Math.max(500, Math.min(4096, Math.ceil(bounds.height + paddingPx * 2)));

  const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.2, 1.5, 0.12);

  return {
    width: imageWidth,
    height: imageHeight,
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
}

export async function generateCanvasImageDataUrl({
  format,
  background = 'light',
  pixelRatio = 2,
  rfInstance = null,
  nodes = [],
}: ExportImageOptions): Promise<string> {
  const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  if (!viewportEl) {
    throw new Error('Diagram canvas viewport is not currently mounted.');
  }

  const { width, height, x, y, zoom } = computeDiagramImageDimensions(nodes, rfInstance);
  const backgroundColor = getBackgroundHex(background);

  const filterNode = (domNode: HTMLElement | Node | Element): boolean => {
    if (domNode instanceof HTMLElement || domNode instanceof SVGElement) {
      if (
        domNode.classList?.contains('react-flow__minimap') ||
        domNode.classList?.contains('react-flow__controls') ||
        domNode.classList?.contains('export-ignore')
      ) {
        return false;
      }
    }
    return true;
  };

  const baseOptions = {
    backgroundColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
    filter: filterNode as (domNode: HTMLElement) => boolean,
  };

  try {
    if (format === 'svg') {
      return await toSvg(viewportEl, baseOptions);
    }
    return await toPng(viewportEl, {
      ...baseOptions,
      pixelRatio,
    });
  } catch {
    // Fallback with skipFonts if browser blocks external font CSS inspection
    if (format === 'svg') {
      return await toSvg(viewportEl, { ...baseOptions, skipFonts: true });
    }
    return await toPng(viewportEl, {
      ...baseOptions,
      pixelRatio,
      skipFonts: true,
    });
  }
}

export function triggerDataUrlDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
