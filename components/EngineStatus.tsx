
import React from 'react';
import { GemColor, MerchantStage } from '../types';
import { COLOR_CONFIG } from '../constants';

interface EngineStatusProps {
  type: GemColor;
  level: number;
  active: boolean;
  merchantStage: MerchantStage;
}

const EngineStatus: React.FC<EngineStatusProps> = ({ type, level, active, merchantStage }) => {
  const config = COLOR_CONFIG[type as keyof typeof COLOR_CONFIG];
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((level / 10) * circumference, circumference);

  const getGemShapeClass = () => {
    if (type === GemColor.RUBY) return 'shape-ruby';
    if (type === GemColor.SAPPHIRE) return 'shape-sapphire';
    return 'shape-emerald';
  };

  const getBorderClass = () => {
    if (!active) return 'border-slate-800 bg-slate-950/50 opacity-40';
    if (merchantStage >= 4) return 'border-amber-400 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.5)]';
    if (merchantStage >= 2) return 'border-slate-300 bg-slate-900';
    return `${config.border} bg-slate-900/80`;
  };

  const spinSpeed = Math.max(1, 4 - level * 0.2);

  return (
    <div className={`
      relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-700
      ${getBorderClass()} ${active ? '-translate-y-1' : ''} glint-container
    `}>
      <div className="relative w-16 h-16 flex items-center justify-center mb-2">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
          <circle 
            cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={`${active ? (merchantStage >= 4 ? 'text-amber-400' : 'text-white') : 'text-slate-600'} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>

        <div className={`
          w-8 h-8 ${getGemShapeClass()} ${active ? config.bg : 'bg-slate-700'} 
          ${active ? 'engine-gem-active' : ''} shadow-lg flex items-center justify-center relative
        `} style={active ? { animationDuration: `${spinSpeed}s` } : {}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />
          {active && <div className={`absolute inset-0 ${config.bg} blur-md opacity-40 animate-pulse`} />}
          
          {/* Enhanced facet glint inside icon */}
          {active && (
            <div className="absolute inset-0 opacity-50 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-[pulse_2s_infinite]" />
          )}
        </div>
      </div>

      <div className="text-center">
        <span className={`text-[10px] font-black tracking-widest uppercase ${active ? (merchantStage >= 4 ? 'text-amber-200' : 'text-white') : 'text-slate-600'}`}>
          {type}
        </span>
        <div className={`text-xs font-bold ${active ? 'text-amber-400' : 'text-slate-700'}`}>
          LV.{level}
        </div>
      </div>

      {active && (
        <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${config.bg} animate-ping`} />
      )}
    </div>
  );
};

export default EngineStatus;
