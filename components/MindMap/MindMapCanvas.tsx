import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { toPng } from 'html-to-image';
import { MindMapNodeData, NodeStyle } from '../../types';
import { useMindMapLayout } from '../../hooks/useMindMapLayout';
import { MindMapNode } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';
import { Toolbar } from './Toolbar';
import { cn, generateId } from '../../utils/cn';
import { expandTopicWithGemini } from '../../services/geminiService';
import { Loader2, Plus, Trash2, Sparkles, GitBranch } from 'lucide-react';

interface MindMapCanvasProps {
  initialData: MindMapNodeData;
  onSave: (data: MindMapNodeData) => void;
  onBack: () => void;
  projectName: string;
  onRenameProject: (name: string) => void;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ initialData, onSave, onBack, projectName, onRenameProject }) => {
  const [data, setData] = useState<MindMapNodeData>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const spaceRef = useRef(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLImageElement>(null);

  // D3 Zoom Setup (init once, filter reads spaceRef)
  useEffect(() => {
    if (!containerRef.current) return;

    const zoom = d3.zoom<HTMLDivElement, unknown>()
      .filter((event) => {
        return (
          event.type === 'wheel' ||
          ((event.type === 'mousedown' || event.type === 'touchstart') && spaceRef.current)
        );
      })
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    const selection = d3.select(containerRef.current);
    selection.call(zoom);
    selection.call(zoom.transform, d3.zoomIdentity.translate(100, window.innerHeight / 2));

    return () => {
      selection.on('.zoom', null);
    };
  }, []);

  // Keep ref in sync without reinitializing zoom
  useEffect(() => {
    spaceRef.current = spacePressed;
  }, [spacePressed]);

  // Track Space key to enable pan mode, but don't block typing spaces
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const active = document.activeElement as HTMLElement | null;
        const isEditing = !!active && (active.getAttribute('contenteditable') === 'true' || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!isEditing) {
          e.preventDefault();
          setSpacePressed(true);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Layout calculation
  const { nodes, links } = useMindMapLayout(data);

  // Helper to update data
  const updateNode = (id: string, updateFn: (node: MindMapNodeData) => MindMapNodeData) => {
    const updateRecursive = (node: MindMapNodeData): MindMapNodeData => {
      if (node.id === id) {
        return updateFn(node);
      }
      return {
        ...node,
        children: node.children.map(updateRecursive)
      };
    };
    const newData = updateRecursive(data);
    setData(newData);
    onSave(newData);
  };

  // Find selected node
  const findNode = (nodes: MindMapNodeData[], id: string): MindMapNodeData | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };
  const selectedNode = selectedId ? findNode([data], selectedId) : null;

  // Actions
  const handleUpdateText = (id: string, newText: string) => {
    updateNode(id, (n) => ({ ...n, text: newText }));
  };

  const handleToggleExpand = (id: string) => {
    updateNode(id, (n) => ({ ...n, isExpanded: !n.isExpanded }));
  };

  const handleUpdateStyle = (style: Partial<NodeStyle>, applyToAll: boolean) => {
    if (applyToAll) {
        const applyRecursive = (node: MindMapNodeData): MindMapNodeData => ({
            ...node,
            style: { ...node.style!, ...style },
            children: node.children.map(applyRecursive)
        });
        const newData = applyRecursive(data);
        setData(newData);
        onSave(newData);
    } else if (selectedId) {
      updateNode(selectedId, (n) => ({ ...n, style: { ...n.style!, ...style } }));
    }
  };

  const handleAddChild = () => {
    if (!selectedId) return;
    updateNode(selectedId, (n) => ({
      ...n,
      isExpanded: true,
      children: [
        ...n.children,
        {
          id: generateId(),
          text: 'New Idea',
          children: [],
          isExpanded: true,
          style: { 
              ...n.style, 
              fontSize: 16, // Reset size to default
              shape: n.style?.shape || 'rounded'
          } as NodeStyle 
        }
      ]
    }));
  };

  const handleAddSibling = () => {
      if (!selectedId || selectedId === 'root') return;
      
      const addSiblingRecursive = (node: MindMapNodeData): MindMapNodeData => {
          const childIndex = node.children.findIndex(c => c.id === selectedId);
          if (childIndex >= 0) {
              const siblingStyle = node.children[childIndex].style!;
              const sibling: MindMapNodeData = {
                  id: generateId(),
                  text: 'New Topic',
                  children: [],
                  isExpanded: true,
                  style: { 
                      ...siblingStyle,
                      fontSize: 16
                  }
              };
              const newChildren = [...node.children];
              newChildren.splice(childIndex + 1, 0, sibling); // Insert after
              return { ...node, children: newChildren };
          }
          return { ...node, children: node.children.map(addSiblingRecursive) };
      };

      const newData = addSiblingRecursive(data);
      setData(newData);
      onSave(newData);
  };

  const handleDeleteNode = () => {
      if (!selectedId || selectedId === 'root') return;
      
      const deleteRecursive = (node: MindMapNodeData): MindMapNodeData => ({
          ...node,
          children: node.children.filter(c => c.id !== selectedId).map(deleteRecursive)
      });
      
      const newData = deleteRecursive(data);
      setData(newData);
      onSave(newData);
      setSelectedId(null);
  };

  const handleAiExpand = async () => {
    if (!selectedId || !selectedNode) return;
    setIsProcessingAI(true);
    try {
      const newNodes = await expandTopicWithGemini(selectedNode.text);
      if (newNodes.length > 0) {
        updateNode(selectedId, (n) => ({
          ...n,
          isExpanded: true,
          children: [...n.children, ...newNodes]
        }));
      }
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (contentRef.current === null) return;
    try {
      // Compute bounds of all nodes to export full map
      const padding = 40;
      let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
      nodes.forEach(n => {
        const left = n.x;
        const top = n.y - n.height / 2;
        const right = n.x + n.width;
        const bottom = n.y + n.height / 2;
        if (left < minLeft) minLeft = left;
        if (top < minTop) minTop = top;
        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
      });
      const exportWidth = Math.max(1, Math.round((maxRight - minLeft) + padding * 2));
      const exportHeight = Math.max(1, Math.round((maxBottom - minTop) + padding * 2));

      // Temporarily override contentRef style to render full map
      const el = contentRef.current;
      const prevTransformStyle = el.style.transform;
      const prevWidth = el.style.width;
      const prevHeight = el.style.height;
      const prevPointer = el.style.pointerEvents;

      el.style.transformOrigin = 'top left';
      el.style.transform = `translate(${-minLeft + padding}px, ${-minTop + padding}px) scale(1)`;
      el.style.width = `${exportWidth}px`;
      el.style.height = `${exportHeight}px`;
      el.style.pointerEvents = 'none';

      // Ensure watermark visible
      if (watermarkRef.current) {
        watermarkRef.current.style.opacity = '0.7';
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }

      const dataUrl = await toPng(el, {
        backgroundColor: '#f8fafc',
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true
      });

      // Restore styles
      el.style.transform = prevTransformStyle;
      el.style.width = prevWidth;
      el.style.height = prevHeight;
      el.style.pointerEvents = prevPointer;
      if (watermarkRef.current) watermarkRef.current.style.opacity = '0';

      const link = document.createElement('a');
      link.download = `mindflow-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert("Failed to export image.");
    }
  }, [nodes, transform]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      // Helper to check if we are currently editing a text node
      const isEditing = document.activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Tab') {
        e.preventDefault();
        if (isEditing) (document.activeElement as HTMLElement).blur();
        handleAddChild();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) return; // Shift+Enter: xuống dòng trong editor
        e.preventDefault();
        if (isEditing) (document.activeElement as HTMLElement).blur();
        if (selectedId !== 'root') {
          handleAddSibling();
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
          if (!isEditing && selectedId !== 'root') {
              handleDeleteNode();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, data]); // Dependencies are crucial here for closures to capture latest state

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Main Canvas Area */}
      <div
        className={cn(
          "flex-1 relative overflow-hidden",
          spacePressed ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        )}
        ref={containerRef}
        onClick={() => setSelectedId(null)}
        onPointerDown={() => {
          if (spacePressed) setIsPanning(true);
        }}
        onPointerUp={() => setIsPanning(false)}
        onPointerLeave={() => setIsPanning(false)}
      >
        
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
             style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Content Layer */}
        <div
          ref={contentRef}
          className="absolute top-0 left-0 origin-top-left w-full h-full"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            pointerEvents: spacePressed ? 'none' : 'auto'
          }}
        >
          <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
            {links.map((link) => (
              <MindMapEdge key={`${link.source.data.id}-${link.target.data.id}`} source={link.source} target={link.target} />
            ))}
          </svg>

          {nodes.map((node) => (
            <MindMapNode
              key={node.data.id}
              node={node.data}
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              isSelected={selectedId === node.data.id}
              onSelect={setSelectedId}
              onUpdate={handleUpdateText}
              onToggleExpand={handleToggleExpand}
            />
          ))}
          <img ref={watermarkRef} src="/logo.png" crossOrigin="anonymous" data-watermark="true" alt="Mindflow" className="absolute bottom-4 left-4 w-20 h-20 opacity-0 pointer-events-none select-none" />
        </div>
        
        {/* Floating Action Dock (Bottom Center) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
             <div className={cn(
                 "flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300",
                 selectedId ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
             )}>
                <button 
                    onClick={handleAddChild}
                    title="Add Child Node (Tab)"
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors group w-20"
                >
                    <GitBranch size={20} />
                    <span className="text-[10px] font-medium">Add Sub</span>
                </button>

                {selectedId !== 'root' && (
                     <button 
                        onClick={handleAddSibling}
                        title="Add Sibling Node (Enter)"
                        className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors group w-20"
                    >
                        <Plus size={20} />
                        <span className="text-[10px] font-medium">Add Topic</span>
                    </button>
                )}

                <div className="w-px h-8 bg-slate-200 mx-1"></div>

                <button 
                    onClick={handleAiExpand}
                    disabled={isProcessingAI}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors group w-20"
                >
                    {isProcessingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    <span className="text-[10px] font-medium">Magic AI</span>
                </button>
                
                 {selectedId !== 'root' && (
                    <>
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                        <button 
                            onClick={handleDeleteNode}
                            title="Delete (Backspace)"
                            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors group w-20"
                        >
                            <Trash2 size={20} />
                            <span className="text-[10px] font-medium">Delete</span>
                        </button>
                    </>
                 )}
             </div>
        </div>

        
      </div>

      {/* Right Toolbar */}
      <Toolbar
        selectedNode={selectedNode}
        onUpdateStyle={handleUpdateStyle}
        onExport={handleExport}
        onBack={onBack}
        isSaving={false}
        projectName={projectName}
        onRenameProject={onRenameProject}
      />
    </div>
  );
};
