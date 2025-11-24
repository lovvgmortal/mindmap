import { useMemo } from 'react';
import * as d3 from 'd3';
import { MindMapNodeData, LayoutNode } from '../types';

// Helper to estimate text dimensions more accurately
function estimateDimensions(text: string, fontSize: number, fontFamily: string, shape: string) {
  // Approximate width multipliers based on font family
  let charWidthMultiplier = 0.6;
  if (fontFamily.includes('Mono')) charWidthMultiplier = 0.65;
  if (fontFamily.includes('Caveat')) charWidthMultiplier = 0.5;
  
  const charWidth = fontSize * charWidthMultiplier; 
  
  // Shape padding
  let paddingX = 32; // default for rounded/rect
  let paddingY = 16;
  
  if (shape === 'pill') paddingX = 40;
  if (shape === 'leaf') paddingX = 40;
  
  // Complex shapes need more horizontal space to avoid clipping corners
  if (shape === 'hexagon' || shape === 'octagon') {
    paddingX = 50; // Corners are cut
  }
  if (shape === 'parallelogram') {
    paddingX = 48; // Skew eats space
  }

  const lines = (text || '').split(/\r?\n/);
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const width = Math.max(80, (longest * charWidth) + paddingX);
  const height = Math.max(40, (lines.length * fontSize * 1.4) + paddingY);
  

  return { width, height };
}

export const useMindMapLayout = (data: MindMapNodeData) => {
  return useMemo(() => {
    // 1. Pre-process to calculate dimensions for every node
    const nodeDimensions = new Map<string, { width: number, height: number }>();
    
    const calculateDims = (node: MindMapNodeData) => {
      const dims = estimateDimensions(
        node.text,
        node.style?.fontSize || 16,
        node.style?.fontFamily || 'Inter',
        node.style?.shape || 'rounded'
      );
      nodeDimensions.set(node.id, dims);
      if (node.children) node.children.forEach(calculateDims);
    };
    calculateDims(data);

    // 2. Create Hierarchy
    // CRITICAL: We pass a children accessor. If !isExpanded, we return null.
    const root = d3.hierarchy<MindMapNodeData>(data, (d) => d.isExpanded ? d.children : null);

    // 3. Calculate Layout
    const treeLayout = d3.tree<MindMapNodeData>()
      .nodeSize([1, 1])
      .separation((a, b) => {
        const dimsA = nodeDimensions.get(a.data.id)!;
        const dimsB = nodeDimensions.get(b.data.id)!;
        const baseGap = 28;
        const halfA = dimsA.height / 2;
        const halfB = dimsB.height / 2;
        return halfA + halfB + baseGap;
      });
    
    treeLayout(root);

    // 4. Process Nodes & Shift positions
    const nodes: LayoutNode[] = [];

    const depthWidths = new Map<number, number>();
    root.descendants().forEach(d => {
       const dims = nodeDimensions.get(d.data.id)!;
       const currentMax = depthWidths.get(d.depth) || 0;
       if (dims.width > currentMax) {
         depthWidths.set(d.depth, dims.width);
       }
    });

    const depthOffsets = new Map<number, number>();
    let currentOffset = 0;
    for (let i = 0; i <= root.height; i++) {
      depthOffsets.set(i, currentOffset);
      currentOffset += (depthWidths.get(i) || 100) + 120;
    }

    root.descendants().forEach((d) => {
      const dims = nodeDimensions.get(d.data.id)!;
      const screenY = d.x;
      const screenX = depthOffsets.get(d.depth) || (d.depth * 220);

      nodes.push({
        data: d.data,
        x: screenX,
        y: screenY,
        width: dims.width,
        height: dims.height,
        depth: d.depth,
        parent: d.parent ? (d.parent as unknown as LayoutNode) : undefined,
      });
    });

    // 5. Process Links
    const links = root.links().map((link) => {
      const sourceNode = nodes.find(n => n.data.id === link.source.data.id)!;
      const targetNode = nodes.find(n => n.data.id === link.target.data.id)!;
      return { source: sourceNode, target: targetNode };
    });

    return { nodes, links };
  }, [data]);
};
