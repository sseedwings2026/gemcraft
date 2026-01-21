
import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import Board from './components/Board';
import EngineStatus from './components/EngineStatus';
import GameOverOverlay from './components/GameOverOverlay';
import HelpModal from './components/HelpModal';
import { GemColor, Direction, ActiveMode } from './types';
import { STAGE_CONFIG, COLOR_CONFIG } from './constants';

// 충전 임계값 (UI 백분율 계산용)
const CHARGE_THRESHOLDS = {
  undo: 800,
  vault: 600,
  portal: 700,
  hammer: 500
};

const App: React.FC = () => {
  const {
    state,
    move,
    resetGame,
    undo,
    useVault,
    usePortal,
    useHammer
  } = useGameLogic();

  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [clickFeedback, setClickFeedback] = useState<string | null>(null);
  const [startFeedback, setStartFeedback] = useState<string | null>(null);
  
  // 중복 클릭 방지를 위한 Ref
  const actionRunningRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const prevStageRef = useRef(state.currentStage);

  // 차단 상태 강제 해제
  const forceExitBlockers = () => {
    setShowHelp(false);
    setShowLevelUp(false);
  };

  // 시작/재시작 핸들러
  const handleStartOrRestart = () => {
    if (actionRunningRef.current) return;
    actionRunningRef.current = true;
    
    console.log("DIRECT CALL: RESET GAME");
    forceExitBlockers();
    resetGame();
    
    setStartFeedback("RESTART OK");
    setTimeout(() => {
      setStartFeedback(null);
      actionRunningRef.current = false;
    }, 400);
  };

  // 피드백 리스너: 성공/실패 텍스트 표시
  useEffect(() => {
    const handleFeedback = (e: any) => {
      const { action, status } = e.detail;
      const actionNameMap: any = { 'VAULT': '금고', 'TRADE': '거래', 'CUT': '세공', 'UNDO': 'UNDO' };
      setClickFeedback(`RUN ${status}: ${actionNameMap[action]}`);
      setTimeout(() => setClickFeedback(null), 250);
      actionRunningRef.current = false; // 완료 시 락 해제
    };
    window.addEventListener('action-feedback' as any, handleFeedback);
    return () => window.removeEventListener('action-feedback' as any, handleFeedback);
  }, []);

  // 토스트 리스너: 표시 시간 2배(1.6초) 연장 보장
  useEffect(() => {
    const handleToast = (e: any) => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      setToastMsg(e.detail);
      toastTimeoutRef.current = window.setTimeout(() => setToastMsg(null), 1600);
    };
    window.addEventListener('game-toast', handleToast);
    return () => {
      window.removeEventListener('game-toast', handleToast);
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // 스테이지 업 감지
  useEffect(() => {
    if (state.currentStage > prevStageRef.current) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 1200);
      prevStageRef.current = state.currentStage;
      return () => clearTimeout(timer);
    }
    prevStageRef.current = state.currentStage;
  }, [state.currentStage]);

  // 키보드 조작
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.gameOver || showHelp || state.isProcessing || actionRunningRef.current) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') move('UP');
      else if (key === 'arrowdown' || key === 's') move('DOWN');
      else if (key === 'arrowleft' || key === 'a') move('LEFT');
      else if (key === 'arrowright' || key === 'd') move('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, state.gameOver, showHelp, state.isProcessing]);

  // 터치 조작
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || state.gameOver || showHelp || state.isProcessing || actionRunningRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (Math.max(absX, absY) > 30) {
      if (absX > absY) move(dx > 0 ? 'RIGHT' : 'LEFT');
      else move(dy > 0 ? 'DOWN' : 'UP');
    }
    setTouchStart(null);
  };

  // 액션 디스패처 (즉시 발동형 도구들)
  const dispatchAction = (actionName: string) => {
    if (actionRunningRef.current) return;
    forceExitBlockers();

    switch (actionName) {
      case 'UNDO':
        if (state.undoCount <= 0) {
          window.dispatchEvent(new CustomEvent('game-toast', { detail: "남은 찬스가 없습니다" }));
          return;
        }
        actionRunningRef.current = true;
        undo();
        window.dispatchEvent(new CustomEvent('action-feedback', { detail: { action: 'UNDO', status: 'OK' } }));
        break;
      case 'SECRET_VAULT':
        if (state.vaultCount <= 0) {
          window.dispatchEvent(new CustomEvent('game-toast', { detail: "남은 찬스가 없습니다" }));
          return;
        }
        actionRunningRef.current = true;
        useVault();
        break;
      case 'NOBLE_TRADE':
        if (state.portalCount <= 0) {
          window.dispatchEvent(new CustomEvent('game-toast', { detail: "남은 찬스가 없습니다" }));
          return;
        }
        actionRunningRef.current = true;
        usePortal();
        break;
      case 'FINE_CUT':
        if (state.hammerCount <= 0) {
          window.dispatchEvent(new CustomEvent('game-toast', { detail: "남은 찬스가 없습니다" }));
          return;
        }
        actionRunningRef.current = true;
        useHammer(); // 이제 인자 없이 호출 (자동 쌍 찾기)
        break;
      case 'HELP':
        setShowHelp(true);
        break;
    }
    
    // 안전장치
    setTimeout(() => { actionRunningRef.current = false; }, 300);
  };

  const config = STAGE_CONFIG[state.currentStage];
  const correctionColor = state.primaryGem ? COLOR_CONFIG[state.primaryGem]?.accent : '#fff';

  const getChargePercent = (current: number, threshold: number, count: number) => {
    if (count >= 2) return 0;
    return Math.floor((current / threshold) * 100);
  };

  return (
    <div 
      className={`min-h-screen ${config.bgClass} flex flex-col items-center justify-start p-4 select-none overflow-hidden touch-none transition-colors duration-1000 relative`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]" />

      {/* 상단 토스트 레이어 */}
      <div className="fixed top-20 left-0 right-0 z-[10000] pointer-events-none flex flex-col items-center gap-2">
        {toastMsg && (
          <div className="bg-slate-950/95 text-white border-2 border-slate-700 px-6 py-2 rounded-2xl text-[10px] font-black tracking-widest text-center shadow-2xl animate-bounce">
            {toastMsg}
          </div>
        )}
        {showLevelUp && (
          <div className="flex flex-col items-center animate-stage-toast">
            <div className="bg-amber-600/90 text-white font-cinzel font-black py-2 px-8 rounded-full text-xl tracking-[0.2em] border-2 border-amber-300 shadow-xl mb-1">STAGE UP!</div>
            {state.primaryGem && (
              <div className="bg-slate-900/95 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest" style={{ borderLeft: `4px solid ${correctionColor}` }}>
                {state.primaryGem} 보정 활성화
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-2 mt-2 z-[9999] pointer-events-auto">
        <div className="flex justify-between items-start pointer-events-none">
          <div>
            <h1 className="text-3xl font-cinzel font-bold tracking-[0.1em] animate-title-shine">Gemcraft</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-500 font-bold uppercase">젬크래프트</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase opacity-80">| {config.name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black">High Score</span>
            <span className="text-xl font-cinzel text-white leading-none">{state.highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2 items-stretch h-14">
          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-center pointer-events-none">
            <span className="text-[8px] text-slate-500 uppercase font-black mb-1">Score</span>
            <span className="text-lg font-cinzel font-bold text-white leading-none">{state.score.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={() => dispatchAction('UNDO')}
            className={`px-3 rounded-xl border flex flex-col items-center justify-center transition-all ${state.undoCount > 0 ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 active:scale-95' : 'opacity-20 grayscale cursor-not-allowed'}`}>
            <span className="text-[8px] font-black">UNDO</span>
            <span className="text-xs font-black">{state.undoCount}</span>
            <span className="text-[7px] font-bold opacity-60">
              {state.undoCount < 2 ? `충전 ${getChargePercent(state.toolCharges.undo, CHARGE_THRESHOLDS.undo, state.undoCount)}%` : 'MAX'}
            </span>
          </button>

          <button 
            onClick={handleStartOrRestart}
            className="px-4 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-400 font-black text-[9px] active:scale-95">
            RESTART
          </button>
          
          <button 
            onClick={() => dispatchAction('HELP')}
            className="w-10 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95">
            ?
          </button>
        </div>

        <div className="flex gap-2 h-16">
          <button 
            onClick={() => dispatchAction('SECRET_VAULT')}
            className={`flex-1 rounded-xl border flex flex-col items-center justify-center transition-all ${state.vaultCount > 0 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'opacity-20 grayscale cursor-not-allowed'}`}>
            <span className="text-[9px] font-black">비밀 금고</span>
            <span className="text-xs font-black">({state.vaultCount})</span>
            <span className="text-[8px] font-bold opacity-70 mt-0.5">
              {state.vaultCount < 2 ? `충전 ${getChargePercent(state.toolCharges.vault, CHARGE_THRESHOLDS.vault, state.vaultCount)}%` : 'MAX'}
            </span>
          </button>

          <button 
            onClick={() => dispatchAction('NOBLE_TRADE')}
            className={`flex-1 rounded-xl border flex flex-col items-center justify-center transition-all ${state.portalCount > 0 ? 'border-purple-500/50 bg-purple-500/10 text-purple-400 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'opacity-20 grayscale cursor-not-allowed'}`}>
            <span className="text-[9px] font-black">귀족 거래</span>
            <span className="text-xs font-black">({state.portalCount})</span>
            <span className="text-[8px] font-bold opacity-70 mt-0.5">
              {state.portalCount < 2 ? `충전 ${getChargePercent(state.toolCharges.portal, CHARGE_THRESHOLDS.portal, state.portalCount)}%` : 'MAX'}
            </span>
          </button>

          <button 
            onClick={() => dispatchAction('FINE_CUT')}
            className={`flex-1 rounded-xl border flex flex-col items-center justify-center transition-all ${state.hammerCount > 0 ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'opacity-20 grayscale cursor-not-allowed'}`}>
            <span className="text-[9px] font-black">정밀 세공</span>
            <span className="text-xs font-black">({state.hammerCount})</span>
            <span className="text-[8px] font-bold opacity-70 mt-0.5">
              {state.hammerCount < 2 ? `충전 ${getChargePercent(state.toolCharges.hammer, CHARGE_THRESHOLDS.hammer, state.hammerCount)}%` : 'MAX'}
            </span>
          </button>
        </div>
      </div>

      <div className={`relative w-full h-full max-w-md aspect-square ${config.boardBg} rounded-2xl p-2 shadow-2xl border-4 border-slate-800/50 transition-all duration-1000 z-10`}>
        {state.correctionTurns > 0 && (
          <div className="absolute inset-0 z-0 opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: correctionColor }} />
        )}
        <Board 
          board={state.board} 
          isProcessing={state.isProcessing} 
          lastMergeType={state.lastMergeType} 
          onTileClick={() => {}} // 모드 고정으로 클릭 핸들러 비활성화
          activeMode={ActiveMode.NORMAL} 
          portalSelection={null} 
        />
        {state.gameOver && <GameOverOverlay state={state} onRestart={handleStartOrRestart} />}
      </div>

      <div className="w-full max-w-md mt-4 grid grid-cols-3 gap-2 z-10 pointer-events-none">
        <EngineStatus type={GemColor.RUBY} level={state.engineLevels[GemColor.RUBY]} active={(state.engineLevels[GemColor.RUBY] || 0) > 0} merchantStage={state.currentStage} />
        <EngineStatus type={GemColor.SAPPHIRE} level={state.engineLevels[GemColor.SAPPHIRE]} active={(state.engineLevels[GemColor.SAPPHIRE] || 0) > 0} merchantStage={state.currentStage} />
        <EngineStatus type={GemColor.EMERALD} level={state.engineLevels[GemColor.EMERALD]} active={(state.engineLevels[GemColor.EMERALD] || 0) > 0} merchantStage={state.currentStage} />
      </div>

      <div className="mt-auto mb-4 text-center z-[9999] pointer-events-none">
         <div className="bg-slate-900/70 border-2 border-slate-700 px-6 py-2 rounded-full inline-block shadow-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">MODE: </span>
            <span className={`text-[12px] font-black uppercase tracking-[0.1em] text-slate-500`}>
              일반
            </span>
         </div>
      </div>

      {showHelp && (
        <HelpModal 
          onClose={() => {
            if (state.gameOver) handleStartOrRestart();
            else setShowHelp(false);
          }} 
        />
      )}

      {/* 피드백 알림 */}
      <div className="fixed bottom-4 right-4 z-[10001] pointer-events-none flex flex-col items-end gap-2">
        {clickFeedback && (
          <div className={`bg-black/90 text-white text-[10px] font-black px-4 py-2 rounded-lg border shadow-2xl animate-pulse ${clickFeedback.includes('FAIL') ? 'border-rose-500 text-rose-400' : 'border-emerald-500 text-emerald-400'}`}>
            {clickFeedback}
          </div>
        )}
        {startFeedback && (
          <div className="bg-amber-600/95 text-white text-[12px] font-black px-6 py-2 rounded-full border-2 border-amber-300 shadow-2xl animate-bounce">
            {startFeedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
