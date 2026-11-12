import React, { useState, useEffect } from 'react';
import { WinnerSlot, PrizeId } from '../types';
import { RotateCw, Check, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface SlotNumberCardProps {
  prizeId: PrizeId;
  slot: WinnerSlot;
  isDrawing: boolean;
  isSpinningThisSlot: boolean;
  isSelectedForRedraw: boolean;
  onToggleSelect: (slotIndex: number) => void;
  onRedrawSingle: (slotIndex: number) => void;
  formatNumber: (num: number | null | undefined) => string;
}

export const SlotNumberCard: React.FC<SlotNumberCardProps> = ({
  slot,
  isDrawing,
  isSpinningThisSlot,
  isSelectedForRedraw,
  onToggleSelect,
  onRedrawSingle,
  formatNumber
}) => {
  const [randomDigits, setRandomDigits] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (slot.status === 'spinning') {
      const interval = setInterval(() => {
        setRandomDigits([
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 10)
        ]);
      }, 70);
      return () => clearInterval(interval);
    }
  }, [slot.status]);

  const isSpinning = slot.status === 'spinning';
  const isRevealed = slot.status === 'revealed';
  const isEmpty = slot.status === 'empty' && slot.number === null;

  const targetFormatted = formatNumber(slot.number);
  const targetDigits = [targetFormatted[0] || '0', targetFormatted[1] || '0', targetFormatted[2] || '0'];

  const getDigitDisplay = (index: number) => {
    if (isEmpty) return '-';
    if (isRevealed) return targetDigits[index];

    if (slot.revealedDigits > index) {
      return targetDigits[index];
    } else {
      return String(randomDigits[index]);
    }
  };

  const isDigitLocked = (index: number) => {
    return isRevealed || slot.revealedDigits > index;
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 shadow-md ${
        isSpinningThisSlot
          ? 'bg-amber-100 border-2 border-amber-500 shadow-xl ring-4 ring-amber-400/40 scale-[1.02] z-10'
          : isSelectedForRedraw
          ? 'bg-amber-50/90 border-2 border-amber-500 shadow-lg ring-2 ring-amber-400/50'
          : isRevealed
          ? 'bg-white border-2 border-amber-300/80 hover:border-amber-400 shadow-md'
          : 'bg-white/90 border-2 border-slate-200/80'
      }`}
    >
      {/* Top Bar: Slot Index & Multi-select Checkbox */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/70">
          당첨 #{slot.slotIndex + 1}
        </span>

        {isRevealed && !isDrawing && (
          <button
            type="button"
            onClick={() => onToggleSelect(slot.slotIndex)}
            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              isSelectedForRedraw
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
            }`}
            title="동시 재추첨 대상으로 선택/해제"
          >
            {isSelectedForRedraw ? (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>재추첨 선택됨</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>선택</span>
              </>
            )}
          </button>
        )}

        {isSpinning && (
          <span className="text-[11px] font-bold text-amber-700 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            {slot.revealedDigits === 0
              ? '추첨 중...'
              : slot.revealedDigits === 1
              ? '1번째 번호!'
              : '2번째 번호!'}
          </span>
        )}

        {isEmpty && <span className="text-[11px] text-slate-400 font-medium">대기</span>}
      </div>

      {/* Main 3 Digits Display: 3 separate digit boxes */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[0, 1, 2].map((idx) => {
            const locked = isDigitLocked(idx);
            const val = getDigitDisplay(idx);

            return (
              <div
                key={idx}
                className={`w-11 h-14 sm:w-13 sm:h-16 flex items-center justify-center rounded-xl font-mono text-3xl sm:text-4xl font-black shadow-inner transition-all ${
                  locked && isRevealed
                    ? 'bg-gradient-to-b from-amber-50 to-amber-100/90 border-2 border-amber-400 text-amber-900 shadow-md'
                    : locked && isSpinning
                    ? 'bg-amber-200 border-2 border-amber-500 text-amber-950 scale-105 shadow-md animate-digit-pop'
                    : isSpinning
                    ? 'bg-amber-100/60 border border-amber-300 text-amber-700/80 animate-pulse'
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}
              >
                {val}
              </div>
            );
          })}
        </div>

        {slot.drawnAt && isRevealed && (
          <div className="text-[10px] text-slate-500 font-mono mt-2 font-medium">
            추첨 시각: {slot.drawnAt}
          </div>
        )}
      </div>

      {/* Bottom Actions: Quick Individual Re-draw Button */}
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-center">
        {isRevealed ? (
          <button
            type="button"
            disabled={isDrawing}
            onClick={() => onRedrawSingle(slot.slotIndex)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="이 번호만 단독으로 다시 추첨합니다"
          >
            <RotateCw className="w-3.5 h-3.5 text-white" />
            <span>개별 재추첨</span>
          </button>
        ) : (
          <div className="w-full text-center text-[10px] text-slate-400 py-1 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3 text-slate-300" />
            <span>추첨 대기</span>
          </div>
        )}
      </div>
    </div>
  );
};
