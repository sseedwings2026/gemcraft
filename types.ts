
export enum GemColor {
  RUBY = 'RUBY',
  SAPPHIRE = 'SAPPHIRE',
  EMERALD = 'EMERALD',
  TOPAZ = 'TOPAZ', 
  DIAMOND = 'DIAMOND' 
}

export type MerchantStage = 1 | 2 | 3 | 4;

export type MergeType = 'NONE' | 'DOUBLE' | 'TRIPLE';

export enum ActiveMode {
  NORMAL = '일반',
  VAULT = '비밀 금고',
  PORTAL = '귀족 거래',
  HAMMER = '정밀 세공'
}

export interface Gem {
  id: number;
  color: GemColor;
  level: number;
  x: number;
  y: number;
  isNew?: boolean;
  isMerged?: boolean;
  isTriple?: boolean;
  prevX?: number;
  prevY?: number;
}

export interface GameState {
  board: (Gem | null)[][];
  score: number;
  highScore: number;
  combo: number;
  engineLevels: {
    [GemColor.RUBY]: number;
    [GemColor.SAPPHIRE]: number;
    [GemColor.EMERALD]: number;
  };
  mergeStats: {
    [GemColor.RUBY]: number;
    [GemColor.SAPPHIRE]: number;
    [GemColor.EMERALD]: number;
  };
  primaryGem: GemColor | null;
  correctionTurns: number;
  undoCount: number;
  vaultCount: number;
  vaultGem: Gem | null;
  vaultTimer: number; 
  portalCount: number;
  hammerCount: number;
  toolCharges: {
    undo: number;
    vault: number;
    portal: number;
    hammer: number;
  };
  hasBlessing: boolean;
  gameOver: boolean;
  isProcessing: boolean; 
  lastMergeType: MergeType;
  history: any[];
  currentStage: MerchantStage;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
