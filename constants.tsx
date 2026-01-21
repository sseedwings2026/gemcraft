
import React from 'react';
import { GemColor, MerchantStage } from './types';

export const GRID_SIZE = 4;

export const COLOR_CONFIG = {
  [GemColor.RUBY]: {
    bg: 'bg-rose-500',
    border: 'border-rose-400',
    shadow: 'shadow-rose-500/50',
    glow: 'from-rose-400 to-rose-600',
    accent: '#f43f5e'
  },
  [GemColor.SAPPHIRE]: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    shadow: 'shadow-blue-500/50',
    glow: 'from-blue-400 to-blue-600',
    accent: '#3b82f6'
  },
  [GemColor.EMERALD]: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    shadow: 'shadow-emerald-500/50',
    glow: 'from-emerald-400 to-emerald-600',
    accent: '#10b981'
  },
  [GemColor.TOPAZ]: {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    shadow: 'shadow-amber-500/50',
    glow: 'from-amber-300 to-amber-500',
    accent: '#f59e0b'
  },
  [GemColor.DIAMOND]: {
    bg: 'bg-slate-100',
    border: 'border-white',
    shadow: 'shadow-slate-300/50',
    glow: 'from-white to-slate-300',
    accent: '#f1f5f9'
  }
};

export const STAGE_CONFIG: Record<MerchantStage, { name: string; desc: string; bgClass: string; boardBg: string }> = {
  1: {
    name: "견습 보석상",
    desc: "Apprentice Gem Merchant",
    bgClass: "bg-[#1a0f0a]", // Dark Wood
    boardBg: "bg-orange-950/20"
  },
  2: {
    name: "숙련 보석상",
    desc: "Skilled Gem Merchant",
    bgClass: "bg-[#0f172a]", // Metal/Navy
    boardBg: "bg-blue-950/20"
  },
  3: {
    name: "명성 있는 보석상",
    desc: "Renowned Gem Merchant",
    bgClass: "bg-[#1e1b4b]", // Deep Velvet
    boardBg: "bg-indigo-950/40"
  },
  4: {
    name: "전설의 보석상",
    desc: "Legendary Gem Merchant",
    bgClass: "bg-[#2d1b00]", // Marble/Gold
    boardBg: "bg-amber-950/40"
  }
};

export const INITIAL_WEIGHTS = {
  [GemColor.RUBY]: 0.33,
  [GemColor.SAPPHIRE]: 0.33,
  [GemColor.EMERALD]: 0.34
};
