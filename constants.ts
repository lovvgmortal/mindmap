import { MindMapNodeData, NodeStyle } from './types';

export const DEFAULT_NODE_STYLE: NodeStyle = {
  color: '#3b82f6', // blue-500
  textColor: '#ffffff',
  fontSize: 14,
  fontFamily: 'Consolas',
  shape: 'rounded',
};

export const FONTS = [
  { name: 'Consolas (Default)', value: 'Consolas' },
  { name: 'Be Vietnam Pro', value: 'Be Vietnam Pro' },
  { name: 'Noto Sans', value: 'Noto Sans' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Inter', value: 'Inter' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Fira Code', value: 'Fira Code' },
  { name: 'Caveat', value: 'Caveat' },
];

export const SHAPES = [
  { name: 'Rounded', value: 'rounded' },
  { name: 'Rect', value: 'rect' },
  { name: 'Pill', value: 'pill' },
  { name: 'Leaf', value: 'leaf' },
  { name: 'Skew', value: 'parallelogram' },
  { name: 'Hex', value: 'hexagon' },
  { name: 'Oct', value: 'octagon' },
];

export const TEXT_COLORS = [
  '#ffffff', // White
  '#0f172a', // Slate 900
  '#334155', // Slate 700
  '#ef4444', // Red
  '#1d4ed8', // Blue
  '#047857', // Emerald
  '#b45309', // Amber
];

// A much larger palette for creativity
export const EXTENDED_COLORS = [
  // Classics
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', 
  // Darks
  '#1e293b', '#334155', '#475569', '#111827', 
  // Pastels
  '#93c5fd', '#fca5a5', '#6ee7b7', '#fcd34d', '#c4b5fd', '#f9a8d4', '#67e8f9',
  // Vibrants
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2',
  // Earthy
  '#78350f', '#581c87', '#be123c', '#15803d', '#b91c1c', '#4338ca', '#0e7490'
];

// Kept for compatibility with old references if any, but UI uses EXTENDED_COLORS
export const COLORS = EXTENDED_COLORS; 

export const INITIAL_DATA: MindMapNodeData = {
  id: 'root',
  text: 'Central Idea',
  isExpanded: true,
  style: { ...DEFAULT_NODE_STYLE, fontSize: 24, color: '#8b5cf6', shape: 'pill', textColor: '#ffffff', fontFamily: 'Consolas' },
  children: []
};
