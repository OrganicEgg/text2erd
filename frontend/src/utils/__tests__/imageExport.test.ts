import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeDiagramImageDimensions,
  generateCanvasImageDataUrl,
  triggerDataUrlDownload,
} from '../imageExport';
import * as htmlToImage from 'html-to-image';
import type { Node } from '@xyflow/react';
import type { TableNodeData } from '../../types/erd';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpng'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;charset=utf-8,mocksvg'),
}));

describe('imageExport utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('computes bounded diagram dimensions and viewport transform for nodes', () => {
    const mockNodes: Node<TableNodeData>[] = [
      {
        id: 'users',
        type: 'tableNode',
        position: { x: 0, y: 0 },
        measured: { width: 260, height: 150 },
        data: {
          table: {
            id: 'users',
            name: 'users',
            columns: [{ name: 'id', type: 'int', is_pk: true }],
          },
          onUpdateTable: vi.fn(),
          onDeleteTable: vi.fn(),
        },
      },
      {
        id: 'posts',
        type: 'tableNode',
        position: { x: 400, y: 200 },
        measured: { width: 260, height: 180 },
        data: {
          table: {
            id: 'posts',
            name: 'posts',
            columns: [
              { name: 'id', type: 'int', is_pk: true },
              { name: 'user_id', type: 'int', is_pk: false, is_fk: true },
            ],
          },
          onUpdateTable: vi.fn(),
          onDeleteTable: vi.fn(),
        },
      },
    ];

    const dims = computeDiagramImageDimensions(mockNodes, null);
    expect(dims.width).toBeGreaterThanOrEqual(800);
    expect(dims.height).toBeGreaterThanOrEqual(500);
    expect(dims.zoom).toBeGreaterThan(0);
  });

  it('captures PNG and SVG snapshots from .react-flow__viewport and filters export-ignore elements', async () => {
    const viewport = document.createElement('div');
    viewport.className = 'react-flow__viewport';
    document.body.appendChild(viewport);

    const pngUrl = await generateCanvasImageDataUrl({
      format: 'png',
      background: 'light',
      pixelRatio: 2,
      nodes: [],
    });
    expect(pngUrl).toBe('data:image/png;base64,mockpng');
    expect(htmlToImage.toPng).toHaveBeenCalledTimes(1);

    const svgUrl = await generateCanvasImageDataUrl({
      format: 'svg',
      background: 'transparent',
      nodes: [],
    });
    expect(svgUrl).toBe('data:image/svg+xml;charset=utf-8,mocksvg');
    expect(htmlToImage.toSvg).toHaveBeenCalledTimes(1);

    // Verify filter excludes .export-ignore and .react-flow__controls
    const callOptions = vi.mocked(htmlToImage.toPng).mock.calls[0][1];
    const ignoredBtn = document.createElement('button');
    ignoredBtn.className = 'export-ignore';
    const normalDiv = document.createElement('div');
    expect(callOptions?.filter?.(ignoredBtn)).toBe(false);
    expect(callOptions?.filter?.(normalDiv)).toBe(true);
  });

  it('triggers anchor download for data URLs', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    triggerDataUrlDownload('data:image/png;base64,abc', 'diagram.png');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });
});
