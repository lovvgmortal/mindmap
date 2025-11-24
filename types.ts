export interface MindMapNodeData {
  id: string;
  text: string;
  children: MindMapNodeData[];
  isExpanded: boolean;
  style?: NodeStyle;
}

export interface NodeStyle {
  color: string;
  textColor?: string;
  fontSize: number; // in px
  fontFamily: string;
  shape: 'rounded' | 'pill' | 'rect' | 'diamond' | 'parallelogram' | 'hexagon' | 'octagon' | 'leaf';
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  data: MindMapNodeData;
}

export interface Point {
  x: number;
  y: number;
}

export interface LayoutNode {
  data: MindMapNodeData;
  x: number; // coordinate on canvas
  y: number; // coordinate on canvas
  width: number;
  height: number;
  children?: LayoutNode[];
  parent?: LayoutNode;
  depth: number;
}

export enum ToolType {
  SELECT = 'SELECT',
  ADD_CHILD = 'ADD_CHILD',
  AI_EXPAND = 'AI_EXPAND',
}
