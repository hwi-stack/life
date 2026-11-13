import React, { useState, useEffect } from 'react';
import { WinnerSlot, PrizeId } from '../types';
import { RotateCw, AlertCircle, CheckSquare, Square } from 'lucide-react';

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

  // Right-to-left reveal order (e.g. 123 -> '3' first, then '2', then '1')
  // revealedDigits 1 -> index 2 locked; 2 -> indices 1,2 locked; 3 -> indices 0,1,2 locked
  const isDigitLocked = (index: number) => {
    return isRevealed || slot.revealedDigits + index >= 3;
  };

  const getDigitDisplay = (index: number) => {
    if (isEmpty) return '-';
    if (isRevealed) return targetDigits[index];

    if (slot.revealedDigits + index >= 3) {
      return targetDigits[index];
    } else {
      return String(randomDigits[index]);
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-3 sm:p-4 rounded-2xl transition-all duration-200 shadow-md ${
        isSpinningThisSlot
          ? 'bg-amber-100 border-2 border-amber-500 shadow-xl ring-4 ring-amber-400/40 scale-[1.02] z-10'
          : isSelectedForRedraw
          ? 'bg-amber-50/95 border-2 border-amber-500 shadow-lg ring-2 ring-amber-400/50'
          : isRevealed
          ? 'bg-white border-2 border-amber-400 hover:border-amber-500 shadow-md'
          : 'bg-white/95 border-2 border-slate-200'
      }`}
    >
      {/* Top Bar: Slot Index & Multi-select Checkbox */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="flex items-center gap-1 text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
          당첨 #{slot.slotIndex + 1}
        </span>

        {isRevealed && !isDrawing && (
          <button
            type="button"
            onClick={() => onToggleSelect(slot.slotIndex)}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              isSelectedForRedraw
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-950 border border-slate-300'
            }`}
            title="동시 재추첨 대상으로 선택/해제"
          >
            {isSelectedForRedraw ? (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>선택됨</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-500" />
                <span>선택</span>
              </>
            )}
          </button>
        )}

        {isSpinning && (
          <span className="text-xs font-bold text-amber-800 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
            {slot.revealedDigits === 0
              ? '추첨 중...'
              : slot.revealedDigits === 1
              ? '1번째 공개!'
              : '2번째 공개!'}
          </span>
        )}

        {isEmpty && <span className="text-xs text-slate-400 font-semibold">대기</span>}
      </div>

      {/* Main 3 Digits Display: Large, high-contrast for seniors/adults */}
      <div className="flex-1 flex flex-col items-center justify-center py-2.5 sm:py-3.5">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full">
          {[0, 1, 2].map((idx) => {
            const locked = isDigitLocked(idx);
            const val = getDigitDisplay(idx);

            return (
              <div
                key={idx}
                className={`flex-1 max-w-[68px] h-16 sm:h-20 lg:h-22 flex items-center justify-center rounded-xl font-mono text-4xl sm:text-5xl lg:text-[54px] leading-none font-black shadow-inner transition-all ${
                  locked && isRevealed
                    ? 'bg-amber-50 border-2 border-amber-500 text-slate-950 shadow-md'
                    : locked && isSpinning
                    ? 'bg-amber-300 border-2 border-amber-600 text-slate-950 scale-105 shadow-md animate-digit-pop'
                    : isSpinning
                    ? 'bg-amber-100/70 border border-amber-300 text-amber-800/80 animate-pulse'
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions: Quick Individual Re-draw Button */}
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-center">
        {isRevealed ? (
          <button
            type="button"
            disabled={isDrawing}
            onClick={() => onRedrawSingle(slot.slotIndex)}
            className="w-full flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="이 번호만 단독으로 다시 추첨합니다"
          >
            <RotateCw className="w-3.5 h-3.5 text-white" />
            <span>개별 재추첨</span>
          </button>
        ) : (
          <div className="w-full text-center text-xs text-slate-400 py-1.5 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
            <span>추첨 대기</span>
          </div>
        )}
      </div>
    </div>
  );
};
