import React, { useRef, useEffect } from 'react';
import { MindMapNodeData } from '../../types';
import { cn } from '../../utils/cn';
import { Minus } from 'lucide-react';

interface MindMapNodeProps {
  node: MindMapNodeData;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, newText: string) => void;
  onToggleExpand: (id: string) => void;
}

export const MindMapNode: React.FC<MindMapNodeProps> = ({
  node,
  x,
  y,
  width,
  height,
  isSelected,
  onSelect,
  onUpdate,
  onToggleExpand,
}) => {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
       // Optional focus logic
    }
  }, [isSelected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Cho phép xuống dòng trong editor
      return;
    }
    if (e.key === 'Enter') {
      // Ngăn xuống dòng mặc định, để Enter thêm topic qua hotkey toàn cục
      e.preventDefault();
      // Thoát chế độ edit để đảm bảo hotkey hoạt động nhất quán
      inputRef.current?.blur();
    }
  };

  const style = node.style || { 
    color: '#3b82f6', 
    textColor: '#ffffff', 
    fontSize: 16, 
    shape: 'rounded', 
    fontFamily: 'Inter' 
  };
  
  const isSkew = style.shape === 'parallelogram';
  
  // CSS Clip Paths for Geometric Shapes
  const getClipPath = () => {
      switch (style.shape) {
          case 'hexagon': return 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)';
          case 'octagon': return 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
          default: return undefined;
      }
  };

  // Border Radius for Standard Shapes
  const getBorderRadius = () => {
      switch (style.shape) {
          case 'pill': return '9999px';
          case 'rect': return '4px';
          case 'leaf': return '0px 24px 0px 24px';
          case 'rounded': return '12px';
          default: return '12px';
      }
  };

  return (
    <div
      className="absolute transition-transform duration-150 ease-out will-change-transform"
      style={{
        left: x,
        top: y,
        width: width,
        height: height,
        zIndex: isSelected ? 50 : 10,
        transform: 'translate(0, -50%)',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Node Body Wrapper - Handles selection ring and transforms */}
      <div className={cn(
          "relative w-full h-full transition-transform duration-150",
          isSelected ? "scale-105" : ""
      )}>
          
          {/* Selection Ring (Separate because clip-path cuts borders) */}
          {isSelected && (
              <div className={cn(
                  "absolute inset-0 border-2 border-indigo-400 opacity-70 scale-110 pointer-events-none",
                  style.shape === 'pill' && "rounded-full",
                  style.shape === 'rounded' && "rounded-xl",
                  style.shape === 'leaf' && "rounded-tr-3xl rounded-bl-3xl",
                  style.shape === 'parallelogram' && "-skew-x-12",
                  (style.shape === 'hexagon' || style.shape === 'octagon') && "hidden" // Hard to outline clipped shapes simply
              )} />
          )}

          {/* Actual Shape Background */}
          <div
            className={cn(
              "absolute inset-0 shadow-md flex items-center justify-center cursor-pointer",
              isSkew && "-skew-x-12",
            )}
            style={{
              backgroundColor: style.color,
              clipPath: getClipPath(),
              borderRadius: getBorderRadius(),
              // Only show border if not clipped, or if simple shape
              border: (style.shape !== 'hexagon' && style.shape !== 'octagon') ? '2px solid transparent' : 'none',
            }}
          >
          </div>

            {/* Content Container (Counter-rotates/skews to keep text straight) */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center px-2 z-10",
                 // No rotation/skew reversal needed for Hex/Oct/Leaf/Pill/Rect
                 // Skew needs reversal
                 isSkew && "skew-x-12"
            )}>
                <div
                    ref={inputRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdate(node.id, e.currentTarget.textContent || '')}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "outline-none text-center font-medium leading-tight w-full break-words whitespace-pre-wrap selection:bg-black/20 min-w-[10px]"
                    )}
                    style={{
                        color: style.textColor || '#ffffff',
                        fontSize: `${style.fontSize}px`,
                        fontFamily: style.fontFamily || 'Inter',
                    }}
                >
                    {node.text}
                </div>
            </div>

            {/* Collapse/Expand Toggle - Improved Hit Area */}
            {node.children && node.children.length > 0 && (
            <button
                onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
                }}
                className={cn(
                "absolute w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 z-20 hover:scale-110 transition-transform cursor-pointer",
                "-right-4 top-1/2 -translate-y-1/2"
                )}
            >
                {/* Icon wrapper with pointer-events-none so clicks fall through to button */}
                <div className="pointer-events-none flex items-center justify-center">
                    {node.isExpanded ? (
                    <Minus size={14} className="text-slate-600" />
                    ) : (
                    <span className="text-xs font-bold text-slate-600 leading-none">{node.children.length}</span>
                    )}
                </div>
            </button>
            )}
      </div>
    </div>
  );
};
