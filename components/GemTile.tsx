
import React, { useMemo } from 'react';
import { Gem, GemColor } from '../types';

interface GemTileProps {
  gem: Gem;
}

const GemTile: React.FC<GemTileProps> = ({ gem }) => {
  const gemStyle = useMemo(() => {
    switch (gem.color) {
      case GemColor.RUBY:
        return {
          shape: 'shape-ruby',
          gradient: 'conic-gradient(from 0deg, #9f1239, #e11d48, #fb7185, #e11d48, #9f1239)',
          innerGlow: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)'
        };
      case GemColor.SAPPHIRE:
        return {
          shape: 'shape-sapphire',
          gradient: 'conic-gradient(from 45deg, #1e3a8a, #2563eb, #60a5fa, #2563eb, #1e3a8a)',
          innerGlow: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 70%)'
        };
      case GemColor.EMERALD:
        return {
          shape: 'shape-emerald',
          gradient: 'conic-gradient(from 90deg, #064e3b, #059669, #34d399, #059669, #064e3b)',
          innerGlow: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.35), transparent 65%)'
        };
      case GemColor.TOPAZ:
        return {
          shape: 'shape-ruby', // Topaz uses brilliant cut
          gradient: 'conic-gradient(from 180deg, #92400e, #d97706, #fcd34d, #d97706, #92400e)',
          innerGlow: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)'
        };
      case GemColor.DIAMOND:
        return {
          shape: 'shape-sapphire', // Diamond uses rounded cushion
          gradient: 'conic-gradient(from 0deg, #e2e8f0, #ffffff, #94a3b8, #ffffff, #e2e8f0)',
          innerGlow: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6), transparent 70%)'
        };
    }
  }, [gem.color]);

  const tilePosition: React.CSSProperties = {
    transform: `translate3d(${gem.x * 100}%, ${gem.y * 100}%, ${gem.isMerged ? '50px' : '0px'})`,
    transition: 'transform 150ms cubic-bezier(0.165, 0.84, 0.44, 1)',
    zIndex: gem.isMerged ? 100 : 1,
  };

  const levelFactor = Math.min(1 + (gem.level - 1) * 0.1, 1.5);

  return (
    <div 
      className={`absolute top-0 left-0 w-1/4 h-1/4 p-2 pointer-events-none ${gem.isTriple && gem.isMerged ? 'animate-ascend' : ''}`}
      style={tilePosition}
    >
      {gem.isTriple && gem.isMerged && (
        <div className="light-column animate-[light-column_0.8s_ease-out]" />
      )}

      <div className={`
        relative w-full h-full flex items-center justify-center transition-all
        ${gem.isMerged ? 'scale-110 brightness-125' : ''}
      `}>
        <div className="absolute inset-2 bg-black/40 rounded-full blur-md translate-y-2 scale-95" />

        <div 
          className={`
            relative w-full h-full ${gemStyle.shape} shadow-inner flex items-center justify-center
            transition-transform duration-300
          `}
          style={{ 
            background: gemStyle.gradient,
            transform: `scale(${levelFactor}) rotateX(-5deg)`,
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute inset-0 opacity-60" style={{ background: gemStyle.innerGlow }} />
          <div className="absolute top-1 left-2 w-1/2 h-1/4 bg-white/30 rounded-full blur-[1px] -rotate-12" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className={`font-cinzel font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${gem.color === GemColor.DIAMOND ? 'text-slate-900' : 'text-white'}`}>
              {gem.level}
            </span>
          </div>

          {gem.level >= 2 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="sparkle-particle" style={{ top: '20%', left: '70%', animationDelay: '0s' }} />
              {gem.level >= 4 && (
                <div className="sparkle-particle" style={{ top: '60%', left: '15%', animationDelay: '0.5s', scale: '0.8' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GemTile;
