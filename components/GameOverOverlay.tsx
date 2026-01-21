
import React from 'react';
import { GameState, GemColor } from '../types';

interface GameOverOverlayProps {
  state: GameState;
  onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ state, onRestart }) => {
  const isLegendary = state.currentStage === 4;

  const getBuildType = () => {
    const { RUBY, SAPPHIRE, EMERALD } = state.engineLevels;
    if (RUBY >= SAPPHIRE && RUBY >= EMERALD) return { label: 'Aggressive Power', color: 'text-rose-400' };
    if (SAPPHIRE >= RUBY && SAPPHIRE >= EMERALD) return { label: 'Steady Stability', color: 'text-blue-400' };
    return { label: 'Dynamic Growth', color: 'text-emerald-400' };
  };

  const build = getBuildType();

  return (
    <div className={`absolute inset-0 ${isLegendary ? 'bg-amber-950/90' : 'bg-slate-950/80'} backdrop-blur-md flex items-center justify-center p-8 z-50 rounded-xl transition-colors duration-1000 pointer-events-none`}>
      <div className="w-full text-center flex flex-col gap-6 pointer-events-auto">
        {isLegendary && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {Array.from({ length: 20 }).map((_, i) => (
               <div key={i} className="sparkle-particle" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, scale: `${1 + Math.random()}` }} />
             ))}
          </div>
        )}

        <div>
          <h2 className={`text-4xl font-cinzel font-bold tracking-widest mb-2 ${isLegendary ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
            {isLegendary ? 'LEGENDARY MERCHANT' : 'FORGE END'}
          </h2>
          <div className={`h-1 w-16 mx-auto ${isLegendary ? 'bg-amber-300' : 'bg-amber-500'}`} />
        </div>

        <div className={`bg-slate-900 border ${isLegendary ? 'border-amber-500/50' : 'border-slate-800'} p-6 rounded-2xl shadow-2xl relative overflow-hidden`}>
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Final Score</p>
          <p className={`text-5xl font-cinzel font-bold mb-6 ${isLegendary ? 'text-amber-300' : 'text-amber-100'}`}>
            {state.score.toLocaleString()}
          </p>

          <div className="text-left space-y-4 border-t border-slate-800 pt-6">
             <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                   <span className="text-[8px] text-slate-500 uppercase font-black">Ruby</span>
                   <span className="text-rose-400 font-bold">{state.engineLevels[GemColor.RUBY]}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] text-slate-500 uppercase font-black">Sapphire</span>
                   <span className="text-blue-400 font-bold">{state.engineLevels[GemColor.SAPPHIRE]}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] text-slate-500 uppercase font-black">Emerald</span>
                   <span className="text-emerald-400 font-bold">{state.engineLevels[GemColor.EMERALD]}</span>
                </div>
             </div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onRestart(); }}
          className={`w-full py-4 font-cinzel font-bold rounded-xl shadow-lg transition-all active:scale-95 border cursor-pointer pointer-events-auto ${isLegendary ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-300' : 'bg-gradient-to-r from-amber-700 to-amber-600 text-white border-amber-500/30'}`}
        >
          {isLegendary ? 'FORGE AGAIN' : 'FORGE START'}
        </button>
      </div>
    </div>
  );
};

export default GameOverOverlay;
