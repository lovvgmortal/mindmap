import React from 'react';
import * as d3 from 'd3';
import { LayoutNode } from '../../types';

interface MindMapEdgeProps {
  source: LayoutNode;
  target: LayoutNode;
}

export const MindMapEdge: React.FC<MindMapEdgeProps> = ({ source, target }) => {
  const linkGenerator = d3.linkHorizontal<any, [number, number]>()
    .x(d => d[0])
    .y(d => d[1]);

  // Calculate Connection Points
  // Our nodes are positioned at top-left X, but centered Y due to CSS.
  // Actually, in Node.tsx we did `transform: translate(0, -50%)`.
  // So (x, y) is the middle-left point of the node visually? 
  // No, layout returns center-y.
  // Width/Height are passed.
  
  const sourceX = source.x + source.width;
  const sourceY = source.y;
  const targetX = target.x;
  const targetY = target.y;

  const pathData = linkGenerator({
    source: [sourceX, sourceY],
    target: [targetX, targetY]
  });

  return (
    <path
      d={pathData || ''}
      fill="none"
      stroke={target.data.style?.color || '#cbd5e1'}
      strokeWidth="2"
      strokeOpacity="0.5"
      className="transition-all duration-500 ease-in-out"
    />
  );
};
