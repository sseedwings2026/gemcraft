
import { useState, useCallback, useEffect } from 'react';
import { Gem, GemColor, GameState, Direction, MergeType, MerchantStage } from '../types';
import { INITIAL_WEIGHTS, GRID_SIZE } from '../constants';
import { audioService } from '../services/AudioService';

const LOCAL_STORAGE_KEY = 'gem-merge-highscore';

// 충전 임계값 설정
const CHARGE_THRESHOLDS = {
  undo: 800,
  vault: 600,
  portal: 700,
  hammer: 500
};

const MAX_TOOL_COUNT = 2;

export const useGameLogic = () => {
  const [state, setState] = useState<GameState>(() => ({
    board: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)),
    score: 0,
    highScore: parseInt(localStorage.getItem(LOCAL_STORAGE_KEY) || '0'),
    combo: 0,
    engineLevels: {
      [GemColor.RUBY]: 0,
      [GemColor.SAPPHIRE]: 0,
      [GemColor.EMERALD]: 0,
    },
    mergeStats: {
      [GemColor.RUBY]: 0,
      [GemColor.SAPPHIRE]: 0,
      [GemColor.EMERALD]: 0,
    },
    primaryGem: null,
    correctionTurns: 0,
    undoCount: 1, 
    vaultCount: 1,
    vaultGem: null,
    vaultTimer: 0,
    portalCount: 1,
    hammerCount: 1,
    toolCharges: {
      undo: 0,
      vault: 0,
      portal: 0,
      hammer: 0
    },
    hasBlessing: true,
    gameOver: false,
    isProcessing: false,
    lastMergeType: 'NONE',
    history: [],
    currentStage: 1
  }));

  const spawnGem = useCallback((
    board: (Gem | null)[][], 
    engineLevels: GameState['engineLevels'], 
    stage: MerchantStage,
    primaryGem: GemColor | null,
    correctionTurns: number
  ) => {
    const emptyCells: { x: number, y: number }[] = [];
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) emptyCells.push({ x, y });
      });
    });

    if (emptyCells.length === 0) return board;

    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const rubyBonus = (engineLevels[GemColor.RUBY] || 0) * 0.05;
    
    const weights: Partial<Record<GemColor, number>> = {
      [GemColor.RUBY]: INITIAL_WEIGHTS[GemColor.RUBY] + rubyBonus,
      [GemColor.SAPPHIRE]: INITIAL_WEIGHTS[GemColor.SAPPHIRE],
      [GemColor.EMERALD]: INITIAL_WEIGHTS[GemColor.EMERALD]
    };

    if (correctionTurns > 0 && primaryGem && weights[primaryGem] !== undefined) {
      weights[primaryGem]! += 0.25;
      Object.keys(weights).forEach(k => {
        const key = k as GemColor;
        if (key !== primaryGem && weights[key] !== undefined) {
          weights[key]! = Math.max(0.05, weights[key]! - 0.1);
        }
      });
    }

    if (stage >= 2) weights[GemColor.TOPAZ] = 0.1;
    if (stage >= 3) weights[GemColor.DIAMOND] = 0.05;
    
    const total = (Object.values(weights) as (number | undefined)[]).reduce((a: number, b) => a + (b || 0), 0);
    const random = Math.random();
    let cumulative = 0;
    let color = GemColor.RUBY;
    
    for (const [c, w] of Object.entries(weights)) {
      cumulative += (w as number) / total;
      if (random <= cumulative) {
        color = c as GemColor;
        break;
      }
    }

    const newGem: Gem = {
      id: Date.now() + Math.random(),
      color,
      level: 1,
      x,
      y,
      isNew: true
    };

    const newBoard = board.map(row => [...row]);
    newBoard[y][x] = newGem;
    return newBoard;
  }, []);

  const initGame = useCallback(() => {
    let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const initialEngines = { [GemColor.RUBY]: 0, [GemColor.SAPPHIRE]: 0, [GemColor.EMERALD]: 0 };
    board = spawnGem(board, initialEngines, 1, null, 0);
    board = spawnGem(board, initialEngines, 1, null, 0);
    
    setState(prev => ({
      ...prev,
      board,
      score: 0,
      combo: 0,
      engineLevels: initialEngines,
      mergeStats: { [GemColor.RUBY]: 0, [GemColor.SAPPHIRE]: 0, [GemColor.EMERALD]: 0 },
      primaryGem: null,
      correctionTurns: 0,
      undoCount: 1,
      vaultCount: 1,
      vaultGem: null,
      vaultTimer: 0,
      portalCount: 1,
      hammerCount: 1,
      toolCharges: { undo: 0, vault: 0, portal: 0, hammer: 0 },
      hasBlessing: true,
      gameOver: false,
      isProcessing: false,
      lastMergeType: 'NONE',
      history: [],
      currentStage: 1
    }));
  }, [spawnGem]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const canMove = (b: (Gem | null)[][]) => {
    if (b.flat().some(cell => cell === null)) return true;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const g = b[y][x]!;
        const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
        for (const [ox, oy] of neighbors) {
          const nx = x + ox, ny = y + oy;
          if (nx >=0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const n = b[ny][nx];
            if (n && n.color === g.color && n.level === g.level) return true;
          }
        }
      }
    }
    return false;
  };

  const move = useCallback((direction: Direction) => {
    setState(prev => {
      if (prev.gameOver || prev.isProcessing) return prev;

      let moved = false;
      let newScore = prev.score;
      let newEngineLevels = { ...prev.engineLevels };
      let newMergeStats = { ...prev.mergeStats };
      let newUndoCount = prev.undoCount;
      let mergeCount = 0;
      let currentTurnMergeType: MergeType = 'NONE';

      let board: (Gem | null)[][] = prev.board.map(row => 
        row.map(cell => cell ? { ...cell, isNew: false, isMerged: false, isTriple: false } : null)
      );

      const getVector = (dir: Direction) => {
        switch (dir) {
          case 'UP': return { dx: 0, dy: -1 };
          case 'DOWN': return { dx: 0, dy: 1 };
          case 'LEFT': return { dx: -1, dy: 0 };
          case 'RIGHT': return { dx: 1, dy: 0 };
        }
      };
      const { dx, dy } = getVector(direction);
      const xRange = direction === 'RIGHT' ? [3, 2, 1, 0] : [0, 1, 2, 3];
      const yRange = direction === 'DOWN' ? [3, 2, 1, 0] : [0, 1, 2, 3];

      for (const y of yRange) {
        xLoop: for (const x of xRange) {
          const gem = board[y][x];
          if (!gem) continue;
          let tx = x, ty = y;
          let nx = x + dx, ny = y + dy;
          const nnx = nx + dx, nny = ny + dy;
          const isTripleMatch = 
            nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE &&
            nnx >= 0 && nnx < GRID_SIZE && nny >= 0 && nny < GRID_SIZE &&
            board[ny][nx]?.color === gem.color && board[ny][nx]?.level === gem.level && !board[ny][nx]?.isMerged &&
            board[nny][nnx]?.color === gem.color && board[nny][nnx]?.level === gem.level && !board[nny][nnx]?.isMerged;
          if (isTripleMatch) {
            const newLevel = gem.level + 2;
            board[y][x] = null;
            board[ny][nx] = null;
            board[nny][nnx] = { ...board[nny][nnx]!, level: newLevel, isMerged: true, isTriple: true, id: Date.now() + Math.random(), x: nnx, y: nny };
            newScore += newLevel * 100;
            currentTurnMergeType = 'TRIPLE';
            if (gem.color in newMergeStats) newMergeStats[gem.color as GemColor]++;
            if (newLevel >= 3 && gem.color in newEngineLevels) {
              if (gem.color === GemColor.SAPPHIRE) newUndoCount += 2;
              newEngineLevels[gem.color as keyof typeof newEngineLevels]++;
            }
            mergeCount++; moved = true; continue xLoop;
          }
          while (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const nextCell = board[ny][nx];
            if (!nextCell) { tx = nx; ty = ny; }
            else if (nextCell.color === gem.color && nextCell.level === gem.level && !nextCell.isMerged) {
              const newLevel = gem.level + 1;
              board[y][x] = null;
              board[ny][nx] = { ...nextCell, level: newLevel, isMerged: true, isTriple: false, id: Date.now() + Math.random(), x: nx, y: ny };
              newScore += newLevel * 20;
              if (gem.color in newMergeStats) newMergeStats[gem.color as GemColor]++;
              if (currentTurnMergeType !== 'TRIPLE') currentTurnMergeType = 'DOUBLE';
              if (newLevel >= 3 && gem.color in newEngineLevels) {
                if (gem.color === GemColor.SAPPHIRE) newUndoCount++;
                newEngineLevels[gem.color as keyof typeof newEngineLevels]++;
              }
              mergeCount++; moved = true; continue xLoop;
            } else break;
            nx += dx; ny += dy;
          }
          if (tx !== x || ty !== y) { board[y][x] = null; board[ty][tx] = { ...gem, x: tx, y: ty }; moved = true; }
        }
      }
      if (moved) {
        if (mergeCount > 0) audioService.playMergeSound(board.flat().find(g => g?.isMerged)?.level || 1, currentTurnMergeType === 'TRIPLE', prev.combo);
        const processResult = () => {
          const gainedScore = newScore - prev.score;
          const activeEngines = (Object.values(newEngineLevels) as number[]).filter((lv: number) => lv > 0).length;
          let newStage: MerchantStage = (Math.min(activeEngines + 1, 4)) as MerchantStage;
          let currentTurnCorrectionTurns = Math.max(0, prev.correctionTurns - 1);
          let currentPrimaryGem = prev.primaryGem;
          
          if (newStage > prev.currentStage) {
            let maxCount = -1; let bestColor: GemColor | null = null;
            Object.entries(newMergeStats).forEach(([c, count]) => {
              const countVal = count as number; if (countVal >= maxCount) { maxCount = countVal; bestColor = c as GemColor; }
            });
            currentPrimaryGem = bestColor; currentTurnCorrectionTurns = 3;
            window.dispatchEvent(new CustomEvent('game-toast', { detail: `STAGE UP: ${currentPrimaryGem} 보정 활성화!` }));
          }

          // 도구 충전 로직 적용
          let nextCharges = { ...prev.toolCharges };
          let nextUndoCount = newUndoCount;
          let nextVaultCount = prev.vaultCount;
          let nextPortalCount = prev.portalCount;
          let nextHammerCount = prev.hammerCount;

          if (gainedScore > 0) {
            // UNDO 충전
            if (nextUndoCount < MAX_TOOL_COUNT) {
              nextCharges.undo += gainedScore;
              if (nextCharges.undo >= CHARGE_THRESHOLDS.undo) {
                nextUndoCount++;
                nextCharges.undo -= CHARGE_THRESHOLDS.undo;
                window.dispatchEvent(new CustomEvent('game-toast', { detail: 'UNDO 기회 +1!' }));
              }
            } else { nextCharges.undo = 0; }

            // VAULT 충전
            if (nextVaultCount < MAX_TOOL_COUNT) {
              nextCharges.vault += gainedScore;
              if (nextCharges.vault >= CHARGE_THRESHOLDS.vault) {
                nextVaultCount++;
                nextCharges.vault -= CHARGE_THRESHOLDS.vault;
                window.dispatchEvent(new CustomEvent('game-toast', { detail: '비밀 금고 기회 +1!' }));
              }
            } else { nextCharges.vault = 0; }

            // PORTAL 충전
            if (nextPortalCount < MAX_TOOL_COUNT) {
              nextCharges.portal += gainedScore;
              if (nextCharges.portal >= CHARGE_THRESHOLDS.portal) {
                nextPortalCount++;
                nextCharges.portal -= CHARGE_THRESHOLDS.portal;
                window.dispatchEvent(new CustomEvent('game-toast', { detail: '귀족 거래 기회 +1!' }));
              }
            } else { nextCharges.portal = 0; }

            // HAMMER 충전
            if (nextHammerCount < MAX_TOOL_COUNT) {
              nextCharges.hammer += gainedScore;
              if (nextCharges.hammer >= CHARGE_THRESHOLDS.hammer) {
                nextHammerCount++;
                nextCharges.hammer -= CHARGE_THRESHOLDS.hammer;
                window.dispatchEvent(new CustomEvent('game-toast', { detail: '정밀 세공 기회 +1!' }));
              }
            } else { nextCharges.hammer = 0; }
          }

          let boardAfterSpawn = spawnGem(board, newEngineLevels, newStage, currentPrimaryGem, currentTurnCorrectionTurns);
          let gameOver = !canMove(boardAfterSpawn);
          let hasBlessing = prev.hasBlessing;
          if (gameOver && hasBlessing) {
            const allGems = boardAfterSpawn.flat().filter(g => g !== null) as Gem[];
            if (allGems.length > 0) {
              const lowestGem = allGems.reduce((prev, curr) => prev.level < curr.level ? prev : curr);
              boardAfterSpawn[lowestGem.y][lowestGem.x] = null;
              gameOver = false; hasBlessing = false;
              window.dispatchEvent(new CustomEvent('game-toast', { detail: '제련의 가호!' }));
            }
          }
          setState(s => ({
            ...s, board: boardAfterSpawn, score: newScore, highScore: Math.max(s.highScore, newScore),
            combo: mergeCount > 0 ? s.combo + 1 : 0, engineLevels: newEngineLevels, mergeStats: newMergeStats,
            primaryGem: currentPrimaryGem, correctionTurns: currentTurnCorrectionTurns, 
            undoCount: nextUndoCount, vaultCount: nextVaultCount, portalCount: nextPortalCount, hammerCount: nextHammerCount,
            toolCharges: nextCharges,
            hasBlessing, gameOver, isProcessing: false, lastMergeType: currentTurnMergeType, currentStage: newStage,
            history: [{ 
              board: prev.board, score: prev.score, engineLevels: prev.engineLevels, mergeStats: prev.mergeStats, 
              primaryGem: prev.primaryGem, correctionTurns: prev.correctionTurns, combo: prev.combo, 
              undoCount: prev.undoCount, currentStage: prev.currentStage, hasBlessing: prev.hasBlessing,
              toolCharges: prev.toolCharges, vaultCount: prev.vaultCount, portalCount: prev.portalCount, hammerCount: prev.hammerCount
            }]
          }));
        };
        setTimeout(processResult, currentTurnMergeType === 'TRIPLE' ? 150 : 100);
        return { ...prev, isProcessing: true, board, lastMergeType: currentTurnMergeType };
      }
      return prev;
    });
  }, [spawnGem]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoCount <= 0 || prev.history.length === 0) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: 'UNDO 불가' }));
        return prev;
      }
      const last = prev.history[0];
      window.dispatchEvent(new CustomEvent('game-toast', { detail: '시간을 되돌렸습니다' }));
      return { ...prev, ...last, undoCount: prev.undoCount - 1, gameOver: false, isProcessing: false, history: [] };
    });
  }, []);

  const resetGame = useCallback(() => {
    initGame();
  }, [initGame]);

  const verifyBoardChange = (oldBoard: (Gem | null)[][], newBoard: (Gem | null)[][]): boolean => {
    const oldFlat = oldBoard.flat();
    const newFlat = newBoard.flat();
    if (oldFlat.length !== newFlat.length) return true;
    for (let i = 0; i < oldFlat.length; i++) {
      if (oldFlat[i]?.id !== newFlat[i]?.id) return true;
    }
    return false;
  };

  const useVault = useCallback(() => {
    setState(s => {
      if (s.vaultCount <= 0) return s;
      const allGems = s.board.flat().filter((g): g is Gem => g !== null);
      if (allGems.length === 0) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: '실행할 수 없습니다' }));
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'VAULT', status: 'FAIL' } }));
        return s;
      }
      const minLevel = Math.min(...allGems.map(g => g.level));
      const candidates = allGems.filter(g => g.level === minLevel);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const newBoard = s.board.map(row => row.map(cell => cell?.id === target.id ? null : cell));
      if (!verifyBoardChange(s.board, newBoard)) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: '실행할 수 없습니다' }));
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'VAULT', status: 'FAIL' } }));
        return s;
      }
      window.dispatchEvent(new CustomEvent('game-toast', { detail: '비밀 금고: 공간을 확보했습니다' }));
      window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'VAULT', status: 'OK' } }));
      return { ...s, board: newBoard, vaultCount: s.vaultCount - 1, isProcessing: false };
    });
  }, []);

  const usePortal = useCallback(() => {
    setState(s => {
      if (s.portalCount <= 0) return s;
      let boardToSpawn = s.board.map(r => [...r]);
      const emptyCells = [];
      boardToSpawn.forEach((r, ry) => r.forEach((c, rx) => { if (!c) emptyCells.push({x: rx, y: ry}); }));
      if (emptyCells.length === 0) {
        const allGems = s.board.flat().filter((g): g is Gem => g !== null);
        if (allGems.length === 0) {
           window.dispatchEvent(new CustomEvent('game-toast', { detail: '실행할 수 없습니다' }));
           window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'TRADE', status: 'FAIL' } }));
           return s;
        }
        const minLevel = Math.min(...allGems.map(g => g.level));
        const target = allGems.filter(g => g.level === minLevel)[0];
        boardToSpawn = boardToSpawn.map(row => row.map(cell => cell?.id === target.id ? null : cell));
        emptyCells.push({x: target.x, y: target.y});
      }
      const spawnPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      let color = s.primaryGem || GemColor.RUBY;
      if (!s.primaryGem) {
        let maxMerge = -1;
        (Object.entries(s.mergeStats) as [string, number][]).forEach(([c, val]) => {
          if (val > maxMerge) { maxMerge = val; color = c as GemColor; }
        });
      }
      boardToSpawn[spawnPos.y][spawnPos.x] = {
        id: Date.now() + Math.random(),
        color,
        level: 1,
        x: spawnPos.x,
        y: spawnPos.y,
        isNew: true
      };
      if (!verifyBoardChange(s.board, boardToSpawn)) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: '실행할 수 없습니다' }));
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'TRADE', status: 'FAIL' } }));
        return s;
      }
      window.dispatchEvent(new CustomEvent('game-toast', { detail: '귀족 거래: 주력 보석을 들여왔습니다' }));
      window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'TRADE', status: 'OK' } }));
      return { ...s, board: boardToSpawn, portalCount: s.portalCount - 1, isProcessing: false };
    });
  }, []);

  // 정밀 세공(Fine Cut): 같은 보석 2개 자동 제거 (즉시 발동)
  const useHammer = useCallback(() => {
    setState(s => {
      if (s.hammerCount <= 0) return s;
      
      const allGems = s.board.flat().filter((g): g is Gem => g !== null);
      
      // 같은 색 + 같은 레벨 쌍 찾기
      const pairs: [Gem, Gem][] = [];
      for (let i = 0; i < allGems.length; i++) {
        for (let j = i + 1; j < allGems.length; j++) {
          const g1 = allGems[i];
          const g2 = allGems[j];
          if (g1.color === g2.color && g1.level === g2.level) {
            pairs.push([g1, g2]);
          }
        }
      }

      if (pairs.length === 0) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: '정밀 세공 실패: 같은 보석 쌍이 없습니다' }));
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'CUT', status: 'FAIL' } }));
        return s;
      }

      // 랜덤하게 한 쌍 선택
      const [target1, target2] = pairs[Math.floor(Math.random() * pairs.length)];
      
      const newBoard = s.board.map(row => row.map(cell => 
        (cell?.id === target1.id || cell?.id === target2.id) ? null : cell
      ));

      if (!verifyBoardChange(s.board, newBoard)) {
        window.dispatchEvent(new CustomEvent('game-toast', { detail: '실행할 수 없습니다' }));
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'CUT', status: 'FAIL' } }));
        return s;
      }

      window.dispatchEvent(new CustomEvent('game-toast', { detail: '정밀 세공: 같은 보석 2개를 정리했습니다' }));
      window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'CUT', status: 'OK' } }));
      console.log("ACTION RUN: CUT (AUTO PAIR)");
      
      return { ...s, board: newBoard, hammerCount: s.hammerCount - 1, isProcessing: false };
    });
  }, []);

  return { state, move, resetGame, undo, useVault, usePortal, useHammer };
};
