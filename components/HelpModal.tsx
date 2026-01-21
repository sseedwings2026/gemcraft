
import React from 'react';
import { GemColor } from '../types';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[10005] flex items-center justify-center p-6 pointer-events-none">
      
      {/* Content Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 flex flex-col items-center pointer-events-auto max-h-[90vh] overflow-y-auto">
        
        {/* Title Section */}
        <div className="flex flex-col items-center mt-2">
          <h2 className="text-3xl font-cinzel font-bold animate-title-shine tracking-[0.2em] mb-1 text-center">Gemcraft</h2>
          <h3 className="text-sm font-cinzel font-bold text-slate-400 tracking-[0.5em] mb-2">젬크래프트</h3>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-2" />
          <p className="text-amber-200/80 font-medium text-[9px] tracking-widest uppercase">전략적 보석 합성 퍼즐</p>
        </div>

        {/* Core Rules Section */}
        <div className="w-full space-y-4 py-4">
          <section className="text-center">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">기본 규칙</h4>
            <p className="text-slate-300 text-xs leading-relaxed font-light">
              스와이프로 보석을 이동시켜<br/>
              같은 단계의 보석을 하나로 합치세요.<br/>
              <span className="text-amber-500/80 font-bold">3개를 동시에 합치면 대량 득점!</span>
            </p>
          </section>

          {/* New Help Tools Section */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
            <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] text-center mb-3">상인의 도구</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-[9px] font-black">금고</span>
                </div>
                <div>
                  <p className="text-emerald-300 text-[10px] font-bold">비밀 금고</p>
                  <p className="text-slate-400 text-[9px]">가장 낮은 레벨의 보석 1개를 즉시 제거하여 공간을 확보합니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shrink-0">
                  <span className="text-purple-400 text-[9px] font-black">거래</span>
                </div>
                <div>
                  <p className="text-purple-300 text-[10px] font-bold">귀족 거래</p>
                  <p className="text-slate-400 text-[9px]">현재 보드의 주력 보석 1개를 즉시 소환합니다. (빈칸이 없으면 1개 제거 후 생성)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shrink-0">
                  <span className="text-orange-400 text-[9px] font-black">세공</span>
                </div>
                <div>
                  <p className="text-orange-300 text-[10px] font-bold">정밀 세공</p>
                  <p className="text-slate-400 text-[9px]">보드에서 색상과 레벨이 동일한 보석 쌍을 찾아 즉시 제거합니다.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-950/20 p-3 rounded-xl border border-slate-800/30">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-2">충전 및 성장</h4>
            <p className="text-slate-400 text-[9px] text-center">점수를 획득할수록 도구 기회가 충전됩니다. (최대 2회 보관)</p>
          </section>
        </div>

        {/* Action Button */}
        <button 
          onClick={onClose}
          className="w-full max-w-[240px] py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-cinzel font-bold rounded-xl transition-all shadow-lg active:scale-95 border border-amber-500/30"
        >
          <span className="tracking-[0.2em] text-sm">FORGE START</span>
        </button>

        <div className="mt-4 text-[7px] text-slate-600 font-bold tracking-widest uppercase">
          Ver 1.6.0 Interaction Patch
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
