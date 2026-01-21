
import React from 'react';
import { Gem as GemType, MergeType, ActiveMode } from '../types';
import GemTile from './GemTile';

interface BoardProps {
  board: (GemType | null)[][];
  isProcessing?: boolean;
  lastMergeType?: MergeType;
  onTileClick?: (gemId: number) => void;
  activeMode: ActiveMode;
  portalSelection: number | null;
}

const Board: React.FC<BoardProps> = ({ board, isProcessing, lastMergeType, onTileClick, activeMode, portalSelection }) => {
  const getPulseClass = () => {
    if (!isProcessing) return '';
    if (lastMergeType === 'TRIPLE') return 'animate-board-triple';
    if (lastMergeType === 'DOUBLE') return 'animate-board-double';
    return '';
  };

  const isInteractionMode = activeMode !== ActiveMode.NORMAL;

  return (
    <div className="w-full h-full board-perspective">
      <div className={`
        relative w-full h-full grid grid-cols-4 grid-rows-4 gap-2 
        bg-slate-950/80 rounded-2xl board-tilt border-b-8 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)]
        p-2 transition-all duration-300 ${getPulseClass()}
        ${activeMode === ActiveMode.VAULT ? 'ring-4 ring-emerald-500/50' : ''}
      `}>
        {/* Background Slots with bevel effect */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div 
            key={`slot-${i}`} 
            className="w-full h-full bg-slate-900/60 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-white/5"
          />
        ))}

        {/* Actual Gems */}
        {board.flat().map((gem) => (
          gem && (
            <div 
              key={gem.id} 
              className={isInteractionMode ? 'cursor-pointer pointer-events-auto hover:brightness-150 transition-all z-[70]' : ''} 
              onClick={(e) => {
                if (isInteractionMode) {
                  e.stopPropagation();
                  onTileClick?.(gem.id);
                }
              }}
            >
              <GemTile gem={gem} />
              
              {/* Mode Visual Overlays */}
              {isInteractionMode && (
                <div className="absolute top-0 left-0 w-1/4 h-1/4 p-2 pointer-events-none flex items-center justify-center" 
                     style={{ transform: `translate3d(${gem.x * 100}%, ${gem.y * 100}%, 60px)` }}>
                  
                  {activeMode === ActiveMode.VAULT && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 animate-ping" />
                  )}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Board;
