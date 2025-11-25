import React, { useState } from 'react';
import { MindMapNodeData, NodeStyle } from '../../types';
import { EXTENDED_COLORS, SHAPES, FONTS, TEXT_COLORS } from '../../constants';
import { Button } from '../ui/Button';
import { Download, ArrowLeft, Save, Type, Box, Layers, Palette } from 'lucide-react';

interface ToolbarProps {
  selectedNode: MindMapNodeData | null;
  onUpdateStyle: (style: Partial<NodeStyle>, applyToAll: boolean) => void;
  onExport: () => void;
  onBack: () => void;
  isSaving: boolean;
  projectName: string;
  onRenameProject: (name: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedNode,
  onUpdateStyle,
  onExport,
  onBack,
  isSaving,
  projectName,
  onRenameProject
}) => {
  const [applyToAll, setApplyToAll] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
           <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition">
             <ArrowLeft size={18} className="text-slate-600" />
           </button>
           {editingTitle ? (
             <input
               autoFocus
               value={tempTitle}
               onChange={(e) => setTempTitle(e.target.value)}
               onBlur={() => { onRenameProject(tempTitle); setEditingTitle(false); }}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') { onRenameProject(tempTitle); setEditingTitle(false); }
                 if (e.key === 'Escape') { setEditingTitle(false); setTempTitle(projectName); }
               }}
               className="bg-transparent border-b border-indigo-500 text-sm font-semibold text-slate-800 outline-none px-1"
             />
           ) : (
             <button onClick={() => { setEditingTitle(true); setTempTitle(projectName); }} className="text-left">
               <h2 className="font-semibold text-slate-800 line-clamp-1" title={projectName}>{projectName}</h2>
             </button>
           )}
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="ghost" className="text-slate-500" disabled={isSaving}>
             {isSaving ? 'Saving...' : <Save size={16} />}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {selectedNode ? (
          <>
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appearance</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={applyToAll} 
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                      />
                      <span className="text-xs text-slate-500 font-medium">Apply to All</span>
                  </label>
              </div>
              
              {/* Shape Selector */}
              <div className="space-y-2">
                 <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Box size={16} /> Shape
                 </label>
                 <div className="grid grid-cols-4 gap-2">
                    {SHAPES.map((shape) => (
                        <button
                            key={shape.value}
                            onClick={() => onUpdateStyle({ shape: shape.value as any }, applyToAll)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                selectedNode.style?.shape === shape.value 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                            title={shape.name}
                        >
                            <div className={`w-5 h-5 border-2 border-current mb-1 ${
                                shape.value === 'rounded' ? 'rounded-md' :
                                shape.value === 'pill' ? 'rounded-full' :
                                shape.value === 'leaf' ? 'rounded-tr-lg rounded-bl-lg' :
                                shape.value === 'hexagon' ? 'rotate-0' :
                                'rounded-none'
                            }`} />
                            <span className="text-[10px]">{shape.name}</span>
                        </button>
                    ))}
                 </div>
              </div>

              <hr className="border-slate-100" />

              {/* Color Pickers */}
              <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                     <Palette size={16} /> Colors
                  </label>
                  
                  {/* Text Color */}
                  <div>
                    <span className="text-xs text-slate-500 mb-2 block">Text Color</span>
                    <div className="flex gap-2 flex-wrap">
                        {TEXT_COLORS.map(color => (
                             <button
                                key={color}
                                onClick={() => onUpdateStyle({ textColor: color }, applyToAll)}
                                className={`w-6 h-6 rounded-full shadow-sm border border-slate-200 transition-transform hover:scale-110 ${
                                    selectedNode.style?.textColor === color ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <input
                          type="color"
                          value={selectedNode.style?.textColor || '#000000'}
                          onChange={(e) => onUpdateStyle({ textColor: e.target.value }, applyToAll)}
                          className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer"
                          title="Custom"
                        />
                    </div>
                  </div>

                  {/* Node Color */}
                  <div>
                    <span className="text-xs text-slate-500 mb-2 block">Background Color</span>
                    <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto p-1">
                    {EXTENDED_COLORS.map((color) => (
                        <button
                        key={color}
                        onClick={() => onUpdateStyle({ color }, applyToAll)}
                        className={`w-6 h-6 rounded-full shadow-sm transition-transform hover:scale-110 ${
                            selectedNode.style?.color === color ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        />
                    ))}
                        <input
                          type="color"
                          value={selectedNode.style?.color || '#3b82f6'}
                          onChange={(e) => onUpdateStyle({ color: e.target.value }, applyToAll)}
                          className="w-8 h-8 rounded-md border border-slate-200 cursor-pointer"
                          title="Custom"
                        />
                    </div>
                  </div>
              </div>

              <hr className="border-slate-100" />

              {/* Typography Section */}
              <div className="space-y-4">
                  {/* Font Family */}
                  <div className="space-y-2">
                     <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Type size={16} /> Font Family
                     </label>
                     <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedNode.style?.fontFamily || 'Consolas'}
                        onChange={(e) => onUpdateStyle({ fontFamily: e.target.value }, applyToAll)}
                     >
                         {FONTS.map(f => (
                             <option key={f.value} value={f.value}>{f.name}</option>
                         ))}
                     </select>
                  </div>

                  {/* Font Size (Number Input) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Font Size (px)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="10"
                            max="72"
                            value={selectedNode.style?.fontSize || 16}
                            onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) }, applyToAll)}
                            className="w-full p-2 text-center border border-slate-200 rounded-md text-slate-900 bg-white focus:ring-indigo-500 outline-none font-mono"
                        />
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="72"
                        value={selectedNode.style?.fontSize || 16}
                        onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) }, applyToAll)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4 opacity-60">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Layers size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Select a node to customize</p>
          </div>
        )}
      </div>

      {/* Footer / Export */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <Button onClick={onExport} className="w-full gap-2" size="lg">
          <Download size={18} /> Export High-Res Image
        </Button>
      </div>
    </div>
  );
};
